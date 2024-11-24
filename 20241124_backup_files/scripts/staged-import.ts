const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse');
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

interface ImportJob {
  id: string;
  job_type: 'client' | 'email_domain';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

async function createImportJob(jobType: 'client' | 'email_domain', totalRecords: number): Promise<ImportJob> {
  const { data, error } = await supabase
    .from('import_jobs')
    .insert({
      job_type: jobType,
      status: 'pending',
      total_records: totalRecords
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateImportJob(
  jobId: string,
  updates: { status?: string; processed_records?: number; failed_records?: number; error_log?: string[] }
) {
  const { error } = await supabase
    .from('import_jobs')
    .update({
      ...updates,
      completed_at: updates.status === 'completed' || updates.status === 'failed' ? new Date().toISOString() : null
    })
    .eq('id', jobId);

  if (error) throw error;
}

async function loadToStaging(filePath: string, jobType: 'client' | 'email_domain'): Promise<ImportJob> {
  const records: any[] = await new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (data) => results.push(data))
      .on('error', reject)
      .on('end', () => resolve(results));
  });

  const job = await createImportJob(jobType, records.length);

  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    const { error } = await supabase
      .from(jobType === 'client' ? 'staging_clients' : 'staging_email_domains')
      .insert(
        batch.map(record => ({
          raw_data: record,
          processed: false
        }))
      );

    if (error) {
      await updateImportJob(job.id, {
        status: 'failed',
        error_log: [`Error loading batch ${i}-${i + batch.length}: ${error.message}`]
      });
      throw error;
    }

    await updateImportJob(job.id, { processed_records: i + batch.length });
  }

  return job;
}

function validateClientData(rawData: any): string[] {
  const errors: string[] = [];
  
  // Required fields
  const requiredFields = ['client_name', 'company_name', 'company_fein'];
  for (const field of requiredFields) {
    if (!rawData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // FEIN format validation
  if (rawData.company_fein && !/^\d{2}-?\d{7}$/.test(rawData.company_fein)) {
    errors.push('Invalid FEIN format');
  }

  return errors;
}

function validateEmailDomainData(rawData: any): string[] {
  const errors: string[] = [];
  
  if (!rawData.from_email && !rawData.domain) {
    errors.push('Either from_email or domain must be provided');
  }

  if (!rawData.client_name) {
    errors.push('Missing client name for matching');
  }

  return errors;
}

async function processStaging(jobType: 'client' | 'email_domain') {
  const table = jobType === 'client' ? 'staging_clients' : 'staging_email_domains';
  const validateFn = jobType === 'client' ? validateClientData : validateEmailDomainData;

  // Get unprocessed records
  const { data: records, error } = await supabase
    .from(table)
    .select('*')
    .eq('processed', false)
    .limit(100);

  if (error) throw error;
  if (!records?.length) return;

  for (const record of records) {
    const validationErrors = validateFn(record.raw_data);
    
    if (validationErrors.length > 0) {
      await supabase
        .from(table)
        .update({
          processed: true,
          validation_errors: validationErrors,
          processed_at: new Date().toISOString()
        })
        .eq('id', record.id);
      continue;
    }

    // Process valid record
    try {
      if (jobType === 'client') {
        await processValidClient(record);
      } else {
        await processValidEmailDomain(record);
      }
    } catch (err) {
      await supabase
        .from(table)
        .update({
          processed: true,
          validation_errors: [(err as Error).message],
          processed_at: new Date().toISOString()
        })
        .eq('id', record.id);
    }
  }
}

async function processValidClient(stagingRecord: any) {
  const rawData = stagingRecord.raw_data;
  
  // Normalize and prepare client data
  const clientData = {
    client_name: rawData.client_name.trim(),
    company_name: rawData.company_name.trim(),
    company_fein: rawData.company_fein.replace('-', ''),
    company_phone: rawData.company_phone,
    address_line_1: rawData.address_line_1,
    address_line_2: rawData.address_line_2,
    city: rawData.city,
    state: rawData.state,
    zip_code: rawData.zip_code,
    normalized_name: normalizeClientName(rawData.client_name)
  };

  // Insert or update client
  const { data: client, error } = await supabase
    .from('clients')
    .upsert(clientData, {
      onConflict: 'company_fein',
      returning: true
    })
    .select()
    .single();

  if (error) throw error;

  // Update staging record
  await supabase
    .from('staging_clients')
    .update({
      processed: true,
      client_id: client.id,
      processed_at: new Date().toISOString()
    })
    .eq('id', stagingRecord.id);
}

async function processValidEmailDomain(stagingRecord: any) {
  const rawData = stagingRecord.raw_data;
  
  // Try to find matching client
  const normalizedClientName = normalizeClientName(rawData.client_name);
  const { data: matchingClients } = await supabase
    .from('clients')
    .select('id, normalized_name')
    .eq('normalized_name', normalizedClientName)
    .limit(1);

  if (!matchingClients?.length) {
    throw new Error(`No matching client found for: ${rawData.client_name}`);
  }

  const domainData = {
    domain: rawData.domain || extractDomain(rawData.from_email),
    client_id: matchingClients[0].id,
    status: rawData.status || 'active'
  };

  // Insert or update email domain
  const { error } = await supabase
    .from('email_domains')
    .upsert(domainData, {
      onConflict: 'domain',
      returning: true
    });

  if (error) throw error;

  // Update staging record
  await supabase
    .from('staging_email_domains')
    .update({
      processed: true,
      matched_client_id: matchingClients[0].id,
      processed_at: new Date().toISOString()
    })
    .eq('id', stagingRecord.id);
}

function normalizeClientName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,]/g, '')
    .replace(/(group|homecare|care|health|staffing|services|inc|llc)$/gi, '')
    .trim();
}

function extractDomain(email: string): string {
  if (!email) return '';
  const match = email.match(/@([^@]+)$/);
  return match ? match[1].toLowerCase() : '';
}

async function generateImportReport(jobId: string): Promise<void> {
  const { data: job } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found');

  const { data: stagingStats } = await supabase
    .from(job.job_type === 'client' ? 'staging_clients' : 'staging_email_domains')
    .select('processed, validation_errors')
    .eq('processed', true);

  const failedRecords = stagingStats?.filter(r => r.validation_errors?.length > 0) || [];
  
  console.log('\nImport Report');
  console.log('=============');
  console.log(`Job Type: ${job.job_type}`);
  console.log(`Status: ${job.status}`);
  console.log(`Total Records: ${job.total_records}`);
  console.log(`Processed: ${job.processed_records}`);
  console.log(`Failed: ${failedRecords.length}`);
  console.log('\nCommon Errors:');
  
  const errorCounts: Record<string, number> = {};
  failedRecords.forEach(record => {
    record.validation_errors?.forEach(error => {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
  });

  Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([error, count]) => {
      console.log(`- ${error}: ${count} occurrences`);
    });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];

  if (!command || !filePath) {
    console.log('Usage: npm run import [clients|domains] <file-path>');
    process.exit(1);
  }

  try {
    const jobType = command === 'clients' ? 'client' : 'email_domain';
    console.log(`Starting ${jobType} import from ${filePath}`);

    // Load data to staging
    const job = await loadToStaging(filePath, jobType);
    console.log('Data loaded to staging tables');

    // Process staging data
    await processStaging(jobType);
    console.log('Finished processing staging data');

    // Generate report
    await generateImportReport(job.id);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
