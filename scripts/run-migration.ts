const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
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
    // Check emails table structure
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'emails' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current emails table structure:', columns);

    // Read migration files
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Execute each migration
    for (const file of files) {
      // Check if migration was already executed
      const { rows } = await client.query(
        'SELECT name FROM _migrations WHERE name = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`Migration ${file} already executed, skipping...`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Run the migration in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Successfully executed migration: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();
