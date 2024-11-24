const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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

async function main() {
  try {
    // Read the SQL file
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20240312_add_email_domain_trigger.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Executing email domain trigger migration...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: sql
    });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('\nMigration completed successfully!');
    console.log('Email domain trigger has been added.');
    console.log('New emails will automatically be mapped to clients based on their domains.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
