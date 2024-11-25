const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !databaseUrl) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1];

// Parse database URL for password
const dbUrlMatch = databaseUrl.match(/postgresql:\/\/postgres\..*?:(.*?)@/);
if (!dbUrlMatch) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}
const dbPassword = dbUrlMatch[1];

const pool = new Pool({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running form_classification_rules migration...');

    // Read and execute the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240304_form_rules.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSql);
    console.log('Migration completed successfully');

    // Verify the table was created
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'form_classification_rules';
    `);

    if (tables.length > 0) {
      console.log('form_classification_rules table exists');
      
      // Check table structure
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'form_classification_rules' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('Table structure:', columns);
    } else {
      console.error('Table was not created');
    }

  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    client.release();
  }
}

runMigration();
