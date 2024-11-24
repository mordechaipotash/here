import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role key for full access
);

async function inspectSchema() {
  try {
    // Get all tables info
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_info');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    // Get email_view definition
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'email_view');

    if (viewsError) {
      console.error('Error fetching view:', viewsError);
      return;
    }

    // Get email_view columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'email_view');

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return;
    }

    // Save results
    const output = {
      tables,
      emailView: views[0],
      emailViewColumns: columns
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'schema_info.json'),
      JSON.stringify(output, null, 2)
    );

    console.log('Schema information has been saved to schema_info.json');
    
    // Also log the email_view columns for immediate viewing
    console.log('\nEmail View Columns:');
    columns.forEach((col: any) => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectSchema();
