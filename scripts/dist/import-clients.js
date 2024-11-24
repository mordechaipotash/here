"use strict";
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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
function normalizeClientName(name) {
    if (!name)
        return '';
    return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[.,]/g, '')
        .replace(/(group|homecare|care|health|staffing|services|inc\.?|llc\.?)$/gi, '')
        .trim();
}
function formatFEIN(fein) {
    if (!fein || fein === 'NaN' || fein.trim() === '')
        return null;
    // Remove any non-digit characters and ensure it's 9 digits
    const digits = fein.replace(/\D/g, '');
    if (digits.length !== 9)
        return null; // Skip invalid FEINs
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}
function parseStates(states) {
    if (!states || states === 'NaN' || states.trim() === '')
        return [];
    return states.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
}
function parseFloat(value) {
    if (!value || value === 'NaN' || value.trim() === '')
        return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}
async function importClients(filePath) {
    console.log('Starting client import...');
    try {
        // Read and parse the CSV file
        const records = await new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                trim: true
            }))
                .on('data', (data) => results.push(data))
                .on('error', reject)
                .on('end', () => resolve(results));
        });
        console.log(`Found ${records.length} records to import`);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        // Process records in batches of 10
        for (let i = 0; i < records.length; i += 10) {
            const batch = records.slice(i, Math.min(i + 10, records.length));
            const clientData = batch
                .filter(record => {
                // Only require client_name as the minimum
                if (!record.client_name?.trim()) {
                    console.log(`Skipping record - missing client name:`, record);
                    errorCount++;
                    errors.push({
                        record,
                        error: 'Missing client name'
                    });
                    return false;
                }
                return true;
            })
                .map(record => {
                const fein = formatFEIN(record.company_fein);
                const clientName = record.client_name?.trim() || '';
                const companyName = record.company_name?.trim() || clientName; // Use client name if company name is missing
                // Check if this is a partial record
                const isPartialRecord = !record.company_name?.trim() ||
                    !record.company_phone?.trim() ||
                    !record.address_line_1?.trim() ||
                    !record.city?.trim() ||
                    !record.state?.trim() ||
                    !record.zip_code;
                return {
                    client_id: record.client_id || null,
                    client_name: clientName,
                    company_name: companyName,
                    company_fein: fein,
                    company_phone: record.company_phone?.trim() || null,
                    company_contact_name: record.company_contact_name?.trim() || null,
                    address_line_1: record.address_line_1?.trim() || null,
                    address_line_2: record.address_line_2?.trim() || null,
                    city: record.city?.trim() || null,
                    state: record.state?.trim() || null,
                    zip_code: record.zip_code?.toString().replace(/\.0$/, '').trim() || null,
                    account_status: record.account_status === 'Active' ? 'Active' : 'Not Active',
                    signed_poa: record.signed_poa === '1' || record.signed_poa === '1.0',
                    signed_by: record.signed_by?.trim() || null,
                    wotc_poa_valid: record.wotc_poa_valid?.trim() || null,
                    percentage: parseFloat(record.percentage),
                    states_company_registered: parseStates(record.states_company_registered)
                };
            });
            if (clientData.length === 0)
                continue;
            // First check if any of these records already exist
            const feins = clientData.map(d => d.company_fein).filter(Boolean);
            const { data: existingClients, error: lookupError } = await supabase
                .from('clients')
                .select('company_fein')
                .in('company_fein', feins);
            if (lookupError) {
                console.error(`Error looking up existing clients:`, lookupError);
                errorCount += clientData.length;
                errors.push({
                    batch: i,
                    error: lookupError.message,
                    records: batch
                });
                continue;
            }
            // Split into new and existing records
            const existingFeins = new Set(existingClients?.map(c => c.company_fein));
            const newRecords = clientData.filter(d => !d.company_fein || !existingFeins.has(d.company_fein));
            const updateRecords = clientData.filter(d => d.company_fein && existingFeins.has(d.company_fein));
            // Insert new records
            if (newRecords.length > 0) {
                const { error: insertError } = await supabase
                    .from('clients')
                    .insert(newRecords);
                if (insertError) {
                    console.error(`Error inserting new records:`, insertError);
                    errorCount += newRecords.length;
                    errors.push({
                        batch: i,
                        error: insertError.message,
                        records: newRecords
                    });
                }
                else {
                    successCount += newRecords.length;
                    console.log(`Inserted ${newRecords.length} new records`);
                }
            }
            // Update existing records
            for (const record of updateRecords) {
                const { error: updateError } = await supabase
                    .from('clients')
                    .update(record)
                    .eq('company_fein', record.company_fein);
                if (updateError) {
                    console.error(`Error updating record:`, updateError);
                    errorCount++;
                    errors.push({
                        batch: i,
                        error: updateError.message,
                        record
                    });
                }
                else {
                    successCount++;
                    console.log(`Updated record for FEIN ${record.company_fein}`);
                }
            }
        }
        console.log('\nImport Summary');
        console.log('==============');
        console.log(`Total records: ${records.length}`);
        console.log(`Successfully imported: ${successCount}`);
        console.log(`Failed: ${errorCount}`);
        if (errors.length > 0) {
            console.log('\nErrors:');
            errors.forEach(error => {
                console.log(`\nBatch ${error.batch}:`);
                console.log(`Error: ${error.error}`);
                console.log('Affected records:', error.records);
            });
        }
    }
    catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}
// Check if file path is provided
const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide the path to the CSV file');
    console.log('Usage: npm run import-clients <path-to-csv>');
    process.exit(1);
}
importClients(filePath);
