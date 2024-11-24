"use strict";
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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function runMigration() {
    try {
        // Create staging_clients table
        const { error: clientsError } = await supabase.from('staging_clients').select('id').limit(1);
        if (clientsError?.code === 'PGRST205') {
            const { error } = await supabase.sql `
        CREATE TABLE IF NOT EXISTS staging_clients (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          raw_data JSONB NOT NULL,
          processed BOOLEAN DEFAULT FALSE,
          validation_errors TEXT[],
          processed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          client_id UUID
        );
        
        CREATE INDEX IF NOT EXISTS idx_staging_clients_processed 
        ON staging_clients(processed);
      `;
            if (error) {
                console.error('Error creating staging_clients:', error);
            }
            else {
                console.log('Created staging_clients table');
            }
        }
        else {
            console.log('staging_clients table already exists');
        }
        // Create staging_email_domains table
        const { error: domainsError } = await supabase.from('staging_email_domains').select('id').limit(1);
        if (domainsError?.code === 'PGRST205') {
            const { error } = await supabase.sql `
        CREATE TABLE IF NOT EXISTS staging_email_domains (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          raw_data JSONB NOT NULL,
          processed BOOLEAN DEFAULT FALSE,
          validation_errors TEXT[],
          processed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          email_domain_id UUID,
          matched_client_id UUID
        );
        
        CREATE INDEX IF NOT EXISTS idx_staging_email_domains_processed 
        ON staging_email_domains(processed);
      `;
            if (error) {
                console.error('Error creating staging_email_domains:', error);
            }
            else {
                console.log('Created staging_email_domains table');
            }
        }
        else {
            console.log('staging_email_domains table already exists');
        }
        // Create import_jobs table
        const { error: jobsError } = await supabase.from('import_jobs').select('id').limit(1);
        if (jobsError?.code === 'PGRST205') {
            const { error } = await supabase.sql `
        CREATE TABLE IF NOT EXISTS import_jobs (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          job_type TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          total_records INTEGER,
          processed_records INTEGER DEFAULT 0,
          failed_records INTEGER DEFAULT 0,
          error_log TEXT[]
        );
        
        CREATE INDEX IF NOT EXISTS idx_import_jobs_status 
        ON import_jobs(status);
      `;
            if (error) {
                console.error('Error creating import_jobs:', error);
            }
            else {
                console.log('Created import_jobs table');
            }
        }
        else {
            console.log('import_jobs table already exists');
        }
        // Add is_partial_record column to clients table
        const { error: addColumnError } = await supabase.rpc('add_partial_record_column', {
            sql_commands: `
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_partial_record BOOLEAN DEFAULT FALSE;
        
        CREATE INDEX IF NOT EXISTS idx_clients_partial_record ON clients(is_partial_record);
        
        UPDATE clients 
        SET is_partial_record = TRUE 
        WHERE company_name IS NULL 
           OR company_phone IS NULL 
           OR address_line_1 IS NULL 
           OR city IS NULL 
           OR state IS NULL 
           OR zip_code IS NULL;
      `
        });
        if (addColumnError) {
            console.error('Error adding is_partial_record column:', addColumnError);
        }
        else {
            console.log('Added is_partial_record column to clients table');
        }
        console.log('Migration completed');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
runMigration();
