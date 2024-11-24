const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface EmailDomain {
  id: string;
  domain: string;
  client_ref_id: string;
  is_primary: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

function extractDomain(email: string): string | null {
  if (!email) return null;
  try {
    // Remove any whitespace and get everything after @
    const domain = email.trim().split('@')[1]?.toLowerCase();
    if (!domain) return null;
    return domain;
  } catch (error) {
    console.error(`Error extracting domain from ${email}:`, error);
    return null;
  }
}

async function findClientByName(clientName: string): Promise<string | null> {
  if (!clientName) return null;
  
  const normalizedName = clientName.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .ilike('client_name', `%${normalizedName}%`)
    .limit(1);
    
  if (error) {
    console.error('Error finding client:', error);
    return null;
  }
  
  return data?.[0]?.id || null;
}

async function addDomainMapping(domain: string, clientId: string, isPrimary: boolean = false, notes: string = '') {
  try {
    const { error } = await supabase
      .from('email_domains')
      .insert([{
        domain,
        client_ref_id: clientId,
        is_primary: isPrimary,
        notes
      }]);
      
    if (error) {
      if (error.code === '23505') { // Unique violation
        console.log(`Domain ${domain} already exists, skipping`);
      } else {
        console.error(`Error adding domain ${domain}:`, error);
      }
      return false;
    }
    
    console.log(`Added domain ${domain} for client ${clientId}`);
    return true;
  } catch (error) {
    console.error(`Error adding domain ${domain}:`, error);
    return false;
  }
}

async function getDomainMapping(domain: string): Promise<EmailDomain | null> {
  try {
    const { data, error } = await supabase
      .from('email_domains')
      .select('*')
      .eq('domain', domain.toLowerCase())
      .single();

    if (error) {
      console.error(`Error getting domain mapping for ${domain}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error getting domain mapping for ${domain}:`, error);
    return null;
  }
}

async function getClientDomains(clientId: string): Promise<EmailDomain[]> {
  try {
    const { data, error } = await supabase
      .from('email_domains')
      .select('*')
      .eq('client_ref_id', clientId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error(`Error getting domains for client ${clientId}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`Error getting domains for client ${clientId}:`, error);
    return [];
  }
}

async function updateDomainMapping(id: string, updates: Partial<EmailDomain>) {
  try {
    const { error } = await supabase
      .from('email_domains')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error(`Error updating domain mapping ${id}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating domain mapping ${id}:`, error);
    return false;
  }
}

async function deleteDomainMapping(id: string) {
  try {
    const { error } = await supabase
      .from('email_domains')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting domain mapping ${id}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting domain mapping ${id}:`, error);
    return false;
  }
}

async function importDomainMappings(filePath: string) {
  console.log('Starting domain mapping import...');
  
  try {
    // Read and parse the CSV file
    const records: any[] = await new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(parse({ 
          columns: true, 
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (data) => results.push(data))
        .on('error', reject)
        .on('end', () => resolve(results));
    });

    console.log(`Found ${records.length} records to import`);
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      const domain = extractDomain(record.email);
      if (!domain) {
        console.error('Invalid email format:', record.email);
        errorCount++;
        continue;
      }

      const clientId = await findClientByName(record.client_name);
      if (!clientId) {
        console.error(`Could not find client: ${record.client_name}`);
        errorCount++;
        continue;
      }

      const success = await addDomainMapping(
        domain,
        clientId,
        record.is_primary === 'true' || record.is_primary === '1',
        record.notes || ''
      );

      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log('\nImport Summary');
    console.log('==============');
    console.log(`Total records: ${records.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Check if file path is provided
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide the path to the CSV file');
  console.error('Usage: npm run import-domains <csv-file>');
  process.exit(1);
}

importDomainMappings(filePath);
