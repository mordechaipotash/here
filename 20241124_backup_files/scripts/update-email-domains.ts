const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Note: needs service role key for admin operations
);

interface EmailDomainMapping {
  from_email: string;
  domain: string;
  client_name: string;
  client_id: string;
  company_name: string;
}

// Map to store numeric ID to UUID mappings
const clientIdMap = new Map<string, string>();

async function getOrCreateClientId(numericId: string): Promise<string> {
  if (clientIdMap.has(numericId)) {
    return clientIdMap.get(numericId)!;
  }

  // Check if we already have this client in the database
  const { data: existingClients } = await supabase
    .from('clients')
    .select('id')
    .eq('numeric_id', numericId)
    .limit(1);

  if (existingClients && existingClients.length > 0) {
    const uuid = existingClients[0].id;
    clientIdMap.set(numericId, uuid);
    return uuid;
  }

  // If not, generate a new UUID
  const uuid = uuidv4();
  clientIdMap.set(numericId, uuid);
  return uuid;
}

async function updateEmailDomains() {
  const csvPath = path.join(process.cwd(), 'email_domains.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Parse CSV
  const records: EmailDomainMapping[] = await new Promise((resolve, reject) => {
    csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });

  // Group records by client_id to collect all company names
  const clientData = new Map<string, { 
    clientName: string, 
    companyNames: Set<string>
  }>();

  records.forEach(record => {
    if (!clientData.has(record.client_id)) {
      clientData.set(record.client_id, {
        clientName: record.client_name,
        companyNames: new Set()
      });
    }
    if (record.company_name) {
      clientData.get(record.client_id)!.companyNames.add(record.company_name);
    }
  });

  // Get unique domain mappings (domain -> client_id)
  const uniqueDomainMappings = new Map<string, { numericId: string, clientId: string, clientName: string }>();
  
  // First pass: collect all unique numeric IDs and generate UUIDs
  for (const record of records) {
    if (record.domain && record.client_id) {
      const uuid = await getOrCreateClientId(record.client_id);
      uniqueDomainMappings.set(record.domain, {
        numericId: record.client_id,
        clientId: uuid,
        clientName: record.client_name
      });
    }
  }

  console.log(`Found ${uniqueDomainMappings.size} unique domain mappings`);

  // First ensure all clients exist
  const clientUpdates = Array.from(clientData.entries())
    .filter(([numericId]) => clientIdMap.has(numericId)) // Only include clients with valid IDs
    .map(([numericId, { clientName, companyNames }]) => ({
      id: clientIdMap.get(numericId)!,
      numeric_id: numericId,
      client_name: clientName || 'Unknown Client',
      company_name: Array.from(companyNames)[0] || clientName || 'Unknown Company'
    }));

  // Upsert clients
  const { error: clientError } = await supabase
    .from('clients')
    .upsert(clientUpdates, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });

  if (clientError) {
    console.error('Error upserting clients:', clientError);
    return;
  }

  // Now update email domains
  const domainUpdates = Array.from(uniqueDomainMappings.entries())
    .map(([domain, { clientId }]) => ({
      domain,
      client_ref_id: clientId
    }));

  // Upsert domain mappings
  const { error: domainError } = await supabase
    .from('email_domains')
    .upsert(domainUpdates, {
      onConflict: 'domain',
      ignoreDuplicates: false
    });

  if (domainError) {
    console.error('Error upserting email domains:', domainError);
    return;
  }

  // Update existing emails that match these domains
  const domainEntries = Array.from(uniqueDomainMappings.entries());
  for (const [domain, { clientId }] of domainEntries) {
    const { error: emailError } = await supabase
      .from('emails')
      .update({ client_ref_id: clientId })
      .filter('from_email', 'ilike', `%@${domain}`)
      .is('client_ref_id', null);

    if (emailError) {
      console.error(`Error updating emails for domain ${domain}:`, emailError);
    }
  }

  console.log('Email domain mappings update completed');
}

updateEmailDomains().catch(console.error);
