import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  'https://yawnfaxeamfxketynfdt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('Fetching emails from Supabase...');
    
    // Fetch emails with their attachments and pdf pages
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select(`
        *,
        attachments (
          *
        ),
        pdf_pages (
          *
        )
      `)
      .order('date', { ascending: false });

    if (emailsError) {
      console.error('Supabase error:', emailsError);
      throw emailsError;
    }

    console.log(`Found ${emails?.length || 0} emails`);

    // Transform the data to match the expected format
    const transformedEmails = emails.map(email => ({
      ...email,
      attachments: email.attachments || [],
      pdf_pages: email.pdf_pages || []
    }));

    console.log('Successfully transformed emails');
    return NextResponse.json(transformedEmails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
