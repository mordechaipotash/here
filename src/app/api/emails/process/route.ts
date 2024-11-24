import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Initialize Supabase client
const supabase = createClient(
  'https://yawnfaxeamfxketynfdt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Label for processed emails
const PROCESSED_LABEL = 'Processed_WP';

async function createLabelIfNeeded() {
  try {
    const res = await gmail.users.labels.list({ userId: 'me' });
    const labels = res.data.labels || [];
    const processedLabel = labels.find(label => label.name === PROCESSED_LABEL);
    
    if (!processedLabel) {
      const newLabel = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: PROCESSED_LABEL,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show'
        }
      });
      return newLabel.data.id;
    }
    
    return processedLabel.id;
  } catch (error) {
    console.error('Error managing labels:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { emailId } = await request.json();

    // Get email from database
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('email_id', emailId)
      .single();

    if (emailError) {
      throw emailError;
    }

    // Get or create Gmail label
    const labelId = await createLabelIfNeeded();

    if (labelId && email.message_id) {
      // Add label to email in Gmail
      await gmail.users.messages.modify({
        userId: 'me',
        id: email.message_id,
        requestBody: {
          addLabelIds: [labelId]
        }
      });
    }

    // Mark as processed in database
    const { error: updateError } = await supabase
      .from('emails')
      .update({ 
        processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('email_id', emailId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}
