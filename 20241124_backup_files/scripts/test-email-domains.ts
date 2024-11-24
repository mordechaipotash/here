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

async function testEmailDomains() {
  try {
    console.log('Testing email domain functionality...\n');

    // 1. First get a client to work with
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, client_name')
      .limit(1)
      .single();

    if (clientError || !client) {
      throw new Error('No test client found');
    }

    console.log(`Using test client: ${client.client_name} (${client.id})`);

    // 2. Add a test domain
    const testDomain = 'test-domain-' + Date.now() + '.com';
    console.log(`\nAdding test domain: ${testDomain}`);
    
    const { data: domainData, error: insertError } = await supabase
      .from('email_domains')
      .insert({
        domain: testDomain,
        client_ref_id: client.id,
        is_primary: true,
        notes: 'Test domain entry'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert domain: ${insertError.message}`);
    }

    console.log('Domain added successfully:', domainData);

    // 3. Test domain lookup
    console.log('\nTesting domain lookup...');
    const testEmail = `test@${testDomain}`;
    const { data: lookupData, error: lookupError } = await supabase
      .from('email_domains')
      .select('client_ref_id, domain')
      .eq('domain', testDomain)
      .single();

    if (lookupError) {
      throw new Error(`Domain lookup failed: ${lookupError.message}`);
    }

    console.log('Domain lookup successful:', lookupData);

    // 4. Test subdomain matching
    console.log('\nTesting subdomain matching...');
    const subdomainEmail = `test@subdomain.${testDomain}`;
    const parts = subdomainEmail.split('@')[1].split('.');
    const parentDomain = parts.slice(-2).join('.');
    
    const { data: subdomainData, error: subdomainError } = await supabase
      .from('email_domains')
      .select('client_ref_id, domain')
      .eq('domain', parentDomain)
      .single();

    if (subdomainError) {
      throw new Error(`Subdomain lookup failed: ${subdomainError.message}`);
    }

    console.log('Subdomain lookup successful:', subdomainData);

    // 5. Clean up test data
    console.log('\nCleaning up test data...');
    const { error: deleteError } = await supabase
      .from('email_domains')
      .delete()
      .eq('domain', testDomain);

    if (deleteError) {
      throw new Error(`Failed to clean up test data: ${deleteError.message}`);
    }

    console.log('Test data cleaned up successfully');
    console.log('\nAll tests completed successfully! 🎉');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testEmailDomains();
