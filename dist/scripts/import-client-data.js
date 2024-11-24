const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');
const dotenv = require('dotenv');
// Load environment variables
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
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
        .replace(/ group$/i, '')
        .replace(/homecare/i, '')
        .replace(/care/i, '')
        .replace(/health/i, '')
        .replace(/staffing/i, '')
        .replace(/services/i, '')
        .replace(/inc\.?$/i, '')
        .replace(/llc\.?$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function parseBoolean(value) {
    if (!value || value.toLowerCase() === 'nan')
        return false;
    if (value === '1' || value === '1.0')
        return true;
    return false;
}
function parseFloat(value) {
    if (!value || value.toLowerCase() === 'nan')
        return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}
async function importClients() {
    console.log('Starting client import...');
    // Read and parse the clients CSV
    const clientsFile = path.join(process.cwd(), 'raw_client_rows.csv');
    const clientsData = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(clientsFile)
            .pipe(csv.parse({ columns: true, skip_empty_lines: true }))
            .on('data', (data) => {
            // Clean up the data
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'string') {
                    data[key] = data[key].trim();
                }
            });
            results.push(data);
        })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
    // Import clients
    for (const client of clientsData) {
        try {
            // First, check if the client already exists
            const { data: existingClient } = await supabase
                .from('clients')
                .select('client_id')
                .eq('legacy_client_id', parseInt(client.client_id))
                .single();
            const clientData = {
                legacy_client_id: parseInt(client.client_id) || null,
                client_name: client.client_name || 'Unknown',
                company_name: client.company_name || client.client_name || 'Unknown',
                company_fein: client.company_fein || null,
                company_phone: client.company_phone || null,
                company_contact_name: client.company_contact_name || null,
                address_line_1: client.address_line_1 || null,
                address_line_2: client.address_line_2 || null,
                city: client.city || null,
                state: client.state || null,
                zip_code: client.zip_code?.replace('.0', '') || null,
                wotc_poa_valid: client.wotc_poa_valid || null,
                percentage: parseFloat(client.percentage),
                states_company_registered: client.states_company_registered || null,
                filled_unfilled: client.filled_unfilled?.toLowerCase() || 'unfilled',
                signed_poa: parseBoolean(client.signed_poa),
                signed_by: client.signed_by || null,
                account_status: client.account_status || 'Active'
            };
            let result;
            if (existingClient) {
                // Update existing client
                result = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('client_id', existingClient.client_id)
                    .select('client_id, client_name')
                    .single();
            }
            else {
                // Insert new client
                result = await supabase
                    .from('clients')
                    .insert(clientData)
                    .select('client_id, client_name')
                    .single();
            }
            if (result.error) {
                console.error('Error importing client:', client.client_name, result.error.message);
            }
            else {
                console.log('Successfully imported client:', client.client_name);
            }
        }
        catch (error) {
            console.error('Failed to import client:', client.client_name, error.message || error);
        }
    }
}
async function importEmailDomains() {
    console.log('Starting email domains import...');
    // Read and parse the email domains CSV
    const domainsFile = path.join(process.cwd(), 'email_domains_rows.csv');
    const domainsData = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(domainsFile)
            .pipe(csv.parse({ columns: true, skip_empty_lines: true }))
            .on('data', (data) => {
            // Clean up the data
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'string') {
                    data[key] = data[key].trim();
                }
            });
            results.push(data);
        })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
    // First, get all clients for mapping
    const { data: clients } = await supabase
        .from('clients')
        .select('client_id, client_name');
    // Create a normalized map of client names to IDs
    const clientMap = new Map(clients?.map(c => [normalizeClientName(c.client_name), c.client_id]) || []);
    // Import domains
    for (const domain of domainsData) {
        try {
            if (!domain.domain || domain.domain === '') {
                console.warn('Skipping empty domain for client:', domain.client_name);
                continue;
            }
            const normalizedClientName = normalizeClientName(domain.client_name);
            const clientId = clientMap.get(normalizedClientName);
            if (!clientId) {
                console.warn('No matching client found for domain:', domain.domain, 'client:', domain.client_name, 'normalized:', normalizedClientName);
                continue;
            }
            const { error } = await supabase
                .from('email_domains')
                .upsert({
                domain: domain.domain.toLowerCase(),
                client_id: clientId,
                status: domain.status?.toLowerCase() || 'unknown',
                notes: domain.notes || null
            });
            if (error) {
                console.error('Error importing domain:', domain.domain, error.message);
            }
            else {
                console.log('Successfully imported domain:', domain.domain, 'for client:', domain.client_name);
            }
        }
        catch (error) {
            console.error('Failed to import domain:', domain.domain, 'for client:', domain.client_name, error);
        }
    }
}
async function main() {
    try {
        await importClients();
        await importEmailDomains();
        console.log('Import completed successfully');
    }
    catch (error) {
        console.error('Import failed:', error);
    }
    process.exit(0);
}
main();
