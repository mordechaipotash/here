const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  try {
    // Check emails table structure
    console.log('\nEmails table structure:');
    const { data: emailsData, error: emailsError } = await supabase
      .from('emails')
      .select()
      .limit(1);

    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
    } else {
      const emailsColumns = emailsData.length > 0 ? Object.keys(emailsData[0]) : [];
      console.log('Emails columns:', emailsColumns);
    }

    // Check email_view structure
    console.log('\nEmail view structure:');
    const { data: viewData, error: viewError } = await supabase
      .from('email_view')
      .select()
      .limit(1);

    if (viewError) {
      console.error('Error fetching email_view:', viewError);
    } else {
      const viewColumns = viewData.length > 0 ? Object.keys(viewData[0]) : [];
      console.log('Email view columns:', viewColumns);
    }

    // Get all tables in the schema
    console.log('\nAll tables:');
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_schema_info');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Tables:', tablesData);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

inspectSchema();
