import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { emailDomainService } from '@/services/email-domain-service';

// Initialize Gmail API client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  token_type: 'Bearer'
});

const gmail = google.gmail({ 
  version: 'v1', 
  auth: oauth2Client,
  retryConfig: {
    retry: 3,
    retryDelay: 1000
  }
});

export async function POST() {
  try {
    const supabase = getSupabaseServer();
    
    // Get list of messages from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${yesterday.getTime() / 1000}`,
      maxResults: 50
    });

    const messages = response.data.messages || [];
    const results = {
      total: messages.length,
      processed: 0,
      errors: 0,
      newEmails: [] as any[]
    };

    for (const message of messages) {
      try {
        // Check if already processed
        const { data: existing } = await supabase
          .from('emails')
          .select('id')
          .eq('email_id', message.id)
          .single();

        if (existing) continue;

        // Get full message details
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });

        const headers = fullMessage.data.payload?.headers;
        const subject = headers?.find(h => h.name === 'Subject')?.value || '';
        const from = headers?.find(h => h.name === 'From')?.value || '';
        const date = headers?.find(h => h.name === 'Date')?.value || '';
        const snippet = fullMessage.data.snippet || '';

        // Extract domain and find client
        const fromEmail = from.match(/<(.+)>/)?.[1] || from;
        const { clientId } = await emailDomainService.findClientByDomain(fromEmail);

        // Store email in database
        const { data: newEmail, error } = await supabase
          .from('emails')
          .insert({
            email_id: message.id,
            subject,
            snippet,
            source: fromEmail,
            date: new Date(date).toISOString(),
            client_id: clientId,
            processing_status: 'unprocessed'
          })
          .select()
          .single();

        if (error) throw error;
        
        results.processed++;
        results.newEmails.push(newEmail);

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
