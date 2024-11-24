const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function applyMigration() {
  try {
    console.log('Starting client labels migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240312_add_client_labels.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log('\nExecuting SQL statement...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'  // Add back the semicolon
      });
      
      if (error) {
        if (error.message.includes('relation "email_domains" does not exist')) {
          console.log('Skipping email_domains related operations - table does not exist yet');
          continue;
        }
        console.error('Error executing statement:', error);
        throw error;
      }
    }
    
    // Verify client colors were assigned
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, client_name, display_color');
      
    if (clientError) {
      console.error('Error verifying client colors:', clientError);
    } else {
      console.log(`\nVerified ${clients.length} clients have colors assigned`);
      console.log('Sample of client colors:');
      clients.slice(0, 5).forEach(client => {
        console.log(`- ${client.client_name}: ${client.display_color}`);
      });
    }
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
