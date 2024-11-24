const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectPDFTables() {
  try {
    // Get sample data from attachments table
    console.log('\nChecking attachments table:');
    const { data: attachments, error: attachError } = await supabase
      .from('attachments')
      .select('*')
      .limit(1);

    if (attachError) {
      console.error('Error querying attachments:', attachError);
    } else {
      console.log('Attachments structure:', JSON.stringify(attachments[0], null, 2));
    }

    // Get sample data from pdf_pages table
    console.log('\nChecking pdf_pages table:');
    const { data: pdfPages, error: pdfError } = await supabase
      .from('pdf_pages')
      .select('*')
      .limit(1);

    if (pdfError) {
      console.error('Error querying pdf_pages:', pdfError);
    } else {
      console.log('PDF Pages structure:', JSON.stringify(pdfPages[0], null, 2));
    }

    // Count PDFs per email
    console.log('\nCounting PDFs per email:');
    const { data: pdfCounts, error: countError } = await supabase
      .from('attachments')
      .select('email_id, count(*)')
      .eq('type', 'application/pdf')
      .group('email_id')
      .limit(5);

    if (countError) {
      console.error('Error counting PDFs:', countError);
    } else {
      console.log('PDF counts per email:', pdfCounts);
    }

    // Get total pages per email
    console.log('\nGetting total pages per email:');
    const { data: pageCounts, error: pageError } = await supabase
      .from('pdf_pages')
      .select('email_id, count(*)')
      .group('email_id')
      .limit(5);

    if (pageError) {
      console.error('Error counting pages:', pageError);
    } else {
      console.log('Page counts per email:', pageCounts);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

inspectPDFTables();
