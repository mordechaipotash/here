const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
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

interface EmailStat {
  email: string;
  domain: string;
  frequency: number;
  first_seen: string;
  last_seen: string;
}

interface Client {
  id: string;
  client_name: string;
}

interface DomainMapping {
  domain: string;
  client_ref_id: string;
  is_primary: boolean;
  notes: string;
}

async function getExistingClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, client_name');

  if (error) throw error;
  return data || [];
}

async function getExistingDomains(): Promise<string[]> {
  const { data, error } = await supabase
    .from('email_domains')
    .select('domain');

  if (error) throw error;
  return (data || []).map(d => d.domain);
}

function findBestClientMatch(domain: string, clients: Client[]): Client | null {
  // First try exact domain name match with client name
  const domainBase = domain.split('.')[0];
  console.log(`\nTrying to match domain: ${domain} (base: ${domainBase})`);
  
  const exactMatch = clients.find(client => {
    const normalizedClientName = client.client_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isMatch = normalizedClientName === domainBase.toLowerCase();
    if (isMatch) {
      console.log(`Found exact match: ${client.client_name}`);
    }
    return isMatch;
  });
  if (exactMatch) return exactMatch;

  // Then try partial matches
  const partialMatch = clients.find(client => {
    const clientNameNormalized = client.client_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isMatch = domainBase.toLowerCase().includes(clientNameNormalized) ||
                   clientNameNormalized.includes(domainBase.toLowerCase());
    if (isMatch) {
      console.log(`Found partial match: ${client.client_name} for ${domain}`);
    }
    return isMatch;
  });
  
  if (!exactMatch && !partialMatch) {
    console.log(`No match found for domain: ${domain}`);
  }
  
  return partialMatch || null;
}

async function readEmailStats(): Promise<EmailStat[]> {
  const csvPath = path.join(__dirname, '..', 'email-statistics.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  return new Promise((resolve, reject) => {
    csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

async function populateEmailDomains() {
  try {
    console.log('Starting email domain population...');
    
    // Get existing data
    const clients = await getExistingClients();
    const existingDomains = await getExistingDomains();
    const emailStats = await readEmailStats();
    
    console.log(`Found ${clients.length} clients and ${emailStats.length} unique domains`);
    console.log('\nSample of client names:');
    clients.slice(0, 5).forEach(client => {
      console.log(`- ${client.client_name}`);
    });
    
    // Group domains by client
    const domainsByFreq = new Map<string, EmailStat>();
    emailStats.forEach(stat => {
      const existing = domainsByFreq.get(stat.domain);
      if (!existing || existing.frequency < stat.frequency) {
        domainsByFreq.set(stat.domain, stat);
      }
    });

    // Prepare domain mappings
    const mappings: DomainMapping[] = [];
    const unmatchedDomains: string[] = [];
    const skippedDomains: string[] = [];

    Array.from(domainsByFreq.entries()).forEach(([domain, stat]) => {
      // Skip if domain already exists
      if (existingDomains.includes(domain)) {
        skippedDomains.push(domain);
        return;
      }

      const matchedClient = findBestClientMatch(domain, clients);
      if (matchedClient) {
        mappings.push({
          domain,
          client_ref_id: matchedClient.id,
          is_primary: false, // We'll update primary flags later
          notes: `Automatically added from email statistics. Frequency: ${stat.frequency}, First seen: ${stat.first_seen}`
        });
      } else {
        unmatchedDomains.push(domain);
      }
    });

    // Set primary domains (highest frequency domain for each client)
    const clientDomains = new Map<string, DomainMapping[]>();
    mappings.forEach(mapping => {
      const existing = clientDomains.get(mapping.client_ref_id) || [];
      existing.push(mapping);
      clientDomains.set(mapping.client_ref_id, existing);
    });

    clientDomains.forEach(domains => {
      if (domains.length > 0) {
        // Find domain with highest frequency
        const primaryDomain = domains.reduce((max, current) => {
          const maxFreq = domainsByFreq.get(max.domain)?.frequency || 0;
          const currentFreq = domainsByFreq.get(current.domain)?.frequency || 0;
          return currentFreq > maxFreq ? current : max;
        });
        primaryDomain.is_primary = true;
      }
    });

    // Insert mappings
    if (mappings.length > 0) {
      const { error } = await supabase
        .from('email_domains')
        .insert(mappings);

      if (error) throw error;
    }

    // Print summary
    console.log('\nDomain Mapping Summary:');
    console.log('-'.repeat(40));
    console.log(`Successfully mapped: ${mappings.length} domains`);
    console.log(`Skipped (already exist): ${skippedDomains.length} domains`);
    console.log(`Unmatched domains: ${unmatchedDomains.length} domains`);
    
    console.log('\nUnmatched Domains:');
    unmatchedDomains.forEach(domain => {
      const stat = domainsByFreq.get(domain);
      console.log(`- ${domain} (${stat?.frequency} emails)`);
    });

    return {
      mapped: mappings.length,
      skipped: skippedDomains.length,
      unmatched: unmatchedDomains.length
    };
  } catch (error) {
    console.error('Error populating email domains:', error);
    throw error;
  }
}

// Run the script
populateEmailDomains()
  .then(results => {
    console.log('\nDomain population completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to populate domains:', error);
    process.exit(1);
  });
