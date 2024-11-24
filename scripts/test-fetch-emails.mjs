import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Gmail API client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Set credentials
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

async function extractDomain(email) {
  if (!email) return null;
  try {
    const domain = email.trim().split('@')[1]?.toLowerCase();
    return domain || null;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return null;
  }
}

async function findClientByDomain(email) {
  const domain = await extractDomain(email);
  if (!domain) return { clientId: null, domain: null };

  try {
    const { data: domainMapping } = await supabase
      .from('email_domains')
      .select('client_ref_id')
      .eq('domain', domain)
      .maybeSingle();

    return {
      clientId: domainMapping?.client_ref_id || null,
      domain
    };
  } catch (error) {
    console.error('Error finding client by domain:', error);
    return { clientId: null, domain };
  }
}

async function fetchRecentEmails() {
  try {
    console.log('Fetching recent emails...');

    // Get list of recent emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,  // Limit to 10 for testing
      q: 'in:inbox'
    });

    if (!response.data || !response.data.messages) {
      console.log('No messages found');
      return;
    }

    // Get full message details
    const messagePromises = response.data.messages.map(message =>
      gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      })
    );

    const messageDetails = await Promise.all(messagePromises);
    
    // Sort by date, newest first
    messageDetails.sort((a, b) => {
      const dateA = parseInt(a.data.internalDate || '0');
      const dateB = parseInt(b.data.internalDate || '0');
      return dateB - dateA;
    });

    // Process each message
    for (const messageResponse of messageDetails) {
      const message = messageResponse.data;
      const headers = message.payload?.headers || [];
      
      // Extract email details
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const fromHeader = headers.find(h => h.name === 'From')?.value || '';
      const date = new Date(parseInt(message.internalDate || '0'));
      
      // Parse from header
      const fromMatch = fromHeader.match(/^(?:"?([^"]*)"?\s)?<?([^>]*)>?$/);
      const fromName = fromMatch?.[1] || null;
      const fromEmail = fromMatch?.[2] || fromHeader;

      // Look up client by email domain
      const { clientId, domain } = await findClientByDomain(fromEmail);

      // Get email body
      const parts = message.payload?.parts || [message.payload];
      let bodyHtml = null;
      let bodyText = null;

      const findBody = (part) => {
        if (part.mimeType === 'text/html') {
          bodyHtml = Buffer.from(part.body?.data || '', 'base64').toString();
        } else if (part.mimeType === 'text/plain') {
          bodyText = Buffer.from(part.body?.data || '', 'base64').toString();
        }
        if (part.parts) {
          part.parts.forEach(findBody);
        }
      };
      parts.forEach(findBody);

      // Check for attachments
      const attachments = [];
      const checkForAttachments = (part) => {
        if (part.body?.attachmentId) {
          attachments.push({
            filename: part.filename || 'unnamed_attachment',
            mimeType: part.mimeType || 'application/octet-stream',
            attachmentId: part.body.attachmentId
          });
        }
        if (part.parts) {
          part.parts.forEach(checkForAttachments);
        }
      };
      parts.forEach(checkForAttachments);

      // Log email information
      console.log('\nEmail Details:');
      console.log('Subject:', subject);
      console.log('From:', fromName, `<${fromEmail}>`);
      console.log('Date:', date);
      console.log('Domain:', domain);
      console.log('Client ID:', clientId);
      console.log('Has HTML body:', !!bodyHtml);
      console.log('Has Text body:', !!bodyText);
      console.log('Attachments:', attachments.map(a => a.filename));
      console.log('Message ID:', message.id);
      console.log('---');
    }

    console.log('\nEmail fetching complete!');
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
}

// Run the script
fetchRecentEmails().catch(console.error);
