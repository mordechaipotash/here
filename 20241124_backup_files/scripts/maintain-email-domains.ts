const { createClient } = require('@supabase/supabase-js');
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

interface UnmappedDomain {
  domain: string;
  email_count: number;
  first_seen: string;
  latest_email_id: string;
}

async function findUnmappedDomains(): Promise<UnmappedDomain[]> {
  const { data, error } = await supabase.rpc('get_unmapped_domains');
  if (error) throw error;
  return data;
}

async function addDomainMapping(domain: string, clientId: string, isPrimary: boolean = false) {
  const { error } = await supabase
    .from('email_domains')
    .insert({
      domain,
      client_ref_id: clientId,
      is_primary: isPrimary,
      notes: 'Added via maintain-email-domains script'
    });

  if (error) throw error;
}

async function updateExistingEmails(domain: string, clientId: string) {
  const { error } = await supabase.rpc('update_emails_by_domain', {
    p_domain: domain,
    p_client_ref_id: clientId
  });

  if (error) throw error;
}

async function main() {
  try {
    // Find domains that aren't mapped but appear in emails
    const unmappedDomains = await findUnmappedDomains();
    
    console.log('\nUnmapped Domains Summary:');
    console.log('-'.repeat(40));
    unmappedDomains.forEach(({ domain, email_count, first_seen }) => {
      console.log(`${domain}: ${email_count} emails (first seen: ${first_seen})`);
    });

    // TODO: Add interactive prompt to map domains to clients
    // For now, just showing the domains that need mapping
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Add SQL function to find unmapped domains
async function setupDatabaseFunctions() {
  const createUnmappedDomainsFunc = `
    CREATE OR REPLACE FUNCTION get_unmapped_domains()
    RETURNS TABLE (
      domain text,
      email_count bigint,
      first_seen timestamp with time zone,
      latest_email_id uuid
    ) AS $$
    BEGIN
      RETURN QUERY
      WITH email_domains_extracted AS (
        SELECT 
          split_part(from_email, '@', 2) as domain,
          COUNT(*) as email_count,
          MIN(date) as first_seen,
          MAX(id) as latest_email_id
        FROM emails
        WHERE from_email IS NOT NULL
        GROUP BY split_part(from_email, '@', 2)
      )
      SELECT 
        ede.domain,
        ede.email_count,
        ede.first_seen,
        ede.latest_email_id
      FROM email_domains_extracted ede
      LEFT JOIN email_domains ed ON ed.domain = ede.domain
      WHERE ed.domain IS NULL
      ORDER BY ede.email_count DESC;
    END;
    $$ LANGUAGE plpgsql;

    -- Function to update existing emails with client_ref_id
    CREATE OR REPLACE FUNCTION update_emails_by_domain(
      p_domain text,
      p_client_ref_id uuid
    ) RETURNS void AS $$
    BEGIN
      UPDATE emails
      SET client_ref_id = p_client_ref_id
      WHERE split_part(from_email, '@', 2) = p_domain
      AND client_ref_id IS NULL;
    END;
    $$ LANGUAGE plpgsql;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: createUnmappedDomainsFunc });
  if (error) throw error;
}

// Setup database functions if running directly
if (require.main === module) {
  setupDatabaseFunctions()
    .then(() => main())
    .catch(error => {
      console.error('Setup error:', error);
      process.exit(1);
    });
}
