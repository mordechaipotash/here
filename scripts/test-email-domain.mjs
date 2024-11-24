import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmailDomains() {
  try {
    // Test getting all domains
    const { data: domains, error } = await supabase
      .from('email_domains')
      .select('*')
      .limit(5);

    if (error) throw error;
    console.log('Sample domains:', domains);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmailDomains();
