const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectPDFData() {
  try {
    // Get a sample email with attachments/PDF data
    const { data, error } = await supabase
      .from('email_view')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    // Log the structure of the data to see what PDF info we have
    console.log('Email data structure:', JSON.stringify(data[0], null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectPDFData();
