"use strict";
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yawnfaxeamfxketynfdt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd25mYXhlYW1meGtldHluZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDY3NjI4NSwiZXhwIjoyMDQ2MjUyMjg1fQ.J4clFE9uMlMab5_8U8117m4qN23GXgF-Y0INDnoJSGk');
async function setupBuckets() {
    try {
        // Create storage buckets
        const buckets = ['pdfs', 'attachments', 'images'];
        for (const bucket of buckets) {
            const { error: bucketError } = await supabase.storage.createBucket(bucket, { public: false });
            if (bucketError && !bucketError.message.includes('already exists')) {
                console.error(`Error creating bucket ${bucket}:`, bucketError);
            }
            else {
                console.log(`Bucket ${bucket} created or already exists`);
            }
        }
    }
    catch (error) {
        console.error('Error setting up buckets:', error);
    }
}
async function checkTables() {
    const tables = ['emails', 'attachments', 'pdf_pages', 'applicants'];
    console.log('\nChecking database tables:');
    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`❌ Table ${table}: Not accessible or doesn't exist`);
                console.log(`   Error: ${error.message}`);
            }
            else {
                console.log(`✅ Table ${table}: Exists with ${count} rows`);
            }
        }
        catch (error) {
            console.error(`Error checking table ${table}:`, error);
        }
    }
    console.log('\nChecking storage buckets:');
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.log('❌ Storage buckets: Not accessible');
            console.log(`   Error: ${error.message}`);
        }
        else {
            buckets.forEach(bucket => {
                console.log(`✅ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
            });
        }
    }
    catch (error) {
        console.error('Error checking storage buckets:', error);
    }
}
async function main() {
    await setupBuckets();
    await checkTables();
}
main().catch(console.error);
