const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listTables() {
  try {
    // Query information_schema to get table names
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Available tables:', data.map(t => t.table_name));
  } catch (err) {
    console.error('Error:', err);
  }
}

listTables();
