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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
function extractDomain(email) {
    if (!email)
        return null;
    try {
        const domain = email.trim().split('@')[1]?.toLowerCase();
        if (!domain)
            return null;
        return domain;
    }
    catch (error) {
        console.error(`Error extracting domain from ${email}:`, error);
        return null;
    }
}
async function getEmailStats() {
    console.log('Fetching email statistics...');
    try {
        // Query both emails and old_emails_31k tables
        const { data: currentEmails, error: currentError } = await supabase
            .from('emails')
            .select('from_email, date')
            .not('from_email', 'is', null);
        const { data: oldEmails, error: oldError } = await supabase
            .from('old_emails_31k')
            .select('from_email, date')
            .not('from_email', 'is', null);
        if (currentError)
            throw currentError;
        if (oldError)
            throw oldError;
        // Combine both datasets
        const allEmails = [...(currentEmails || []), ...(oldEmails || [])];
        // Create a map to store email statistics
        const emailMap = new Map();
        // Process all emails
        allEmails.forEach(record => {
            const email = record.from_email?.toLowerCase().trim();
            if (!email)
                return;
            const domain = extractDomain(email);
            if (!domain)
                return;
            const date = new Date(record.date);
            const stats = emailMap.get(email) || { count: 0, domain, dates: [] };
            stats.count++;
            stats.dates.push(date);
            emailMap.set(email, stats);
        });
        // Convert map to array and sort by frequency
        const stats = Array.from(emailMap.entries())
            .map(([email, stats]) => ({
            email,
            domain: stats.domain,
            frequency: stats.count,
            first_seen: new Date(Math.min(...stats.dates.map(d => d.getTime()))).toISOString(),
            last_seen: new Date(Math.max(...stats.dates.map(d => d.getTime()))).toISOString()
        }))
            .sort((a, b) => b.frequency - a.frequency);
        return stats;
    }
    catch (error) {
        console.error('Error fetching email statistics:', error);
        throw error;
    }
}
async function writeStatsToCSV(stats, outputPath) {
    console.log('Writing statistics to CSV...');
    const csvContent = [
        'email,domain,frequency,first_seen,last_seen',
        ...stats.map(stat => `"${stat.email}","${stat.domain}",${stat.frequency},"${stat.first_seen}","${stat.last_seen}"`)
    ].join('\n');
    fs.writeFileSync(outputPath, csvContent);
    console.log(`Statistics written to ${outputPath}`);
    // Print summary
    console.log('\nSummary:');
    console.log('-'.repeat(40));
    console.log(`Total unique emails: ${stats.length}`);
    console.log(`Most frequent email: ${stats[0].email} (${stats[0].frequency} occurrences)`);
    // Get domain statistics
    const domainStats = stats.reduce((acc, stat) => {
        acc[stat.domain] = (acc[stat.domain] || 0) + stat.frequency;
        return acc;
    }, {});
    const topDomains = Object.entries(domainStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    console.log('\nTop 5 Domains:');
    topDomains.forEach(([domain, count]) => {
        console.log(`${domain}: ${count} emails`);
    });
}
async function main() {
    try {
        const stats = await getEmailStats();
        const outputPath = path.join(__dirname, '..', 'email-statistics.csv');
        await writeStatsToCSV(stats, outputPath);
    }
    catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}
// Run the script
main();
