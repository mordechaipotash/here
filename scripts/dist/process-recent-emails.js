"use strict";
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const axios = require('axios');
const { fromPath } = require('pdf2pic');
const fs = require('fs').promises;
const os = require('os');
const sharp = require('sharp');
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const PDF_SERVER_URL = 'http://localhost:3000';
// Initialize Gmail API client
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
// Set credentials directly
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
// Define bucket names as constants to ensure consistency
const BUCKET_NAMES = {
    PDF: 'pdfs', // for storing PDF files
    ATTACHMENT: 'attachments', // for storing non-PDF attachments
    IMAGE: 'images' // for storing PDF page images
};
// PDF to Image conversion options
const PDF_TO_IMAGE_OPTIONS = {
    density: 300,
    saveFilename: "untitled",
    savePath: os.tmpdir(),
    format: "png", // Changed to PNG for better quality
    width: 2550, // Increased to A4 size at 300 DPI
    height: 3300, // Increased to A4 size at 300 DPI
    quality: 100 // Maximum quality
};
// Label names for different tracks
const TRACK_LABELS = {
    WOTC_MACHINE: 'WOTC_Machine',
    FORMS_ADMIN: 'Forms_Admin'
};
// Create labels if they don't exist
async function createLabelsIfNeeded(gmail) {
    try {
        const { data: { labels } } = await gmail.users.labels.list({ userId: 'me' });
        const labelPromises = Object.values(TRACK_LABELS).map(async (labelName) => {
            const existingLabel = labels.find(label => label.name === labelName);
            if (existingLabel) {
                return existingLabel.id;
            }
            const { data: newLabel } = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    name: labelName,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show'
                }
            });
            return newLabel.id;
        });
        const [wotcLabelId, formsLabelId] = await Promise.all(labelPromises);
        return {
            [TRACK_LABELS.WOTC_MACHINE]: wotcLabelId,
            [TRACK_LABELS.FORMS_ADMIN]: formsLabelId
        };
    }
    catch (error) {
        console.error('Error creating labels:', error);
        return null;
    }
}
async function checkIfProcessed(supabase, messageId) {
    try {
        const { data, error } = await supabase
            .from('emails')
            .select('email_id, track')
            .eq('message_id', messageId);
        if (error) {
            console.error('Error checking processed status:', error);
            return { processed: false };
        }
        // If no data or empty array, email hasn't been processed
        if (!data || data.length === 0) {
            return { processed: false };
        }
        // Return first matching email (should only be one due to unique constraint)
        return {
            processed: true,
            emailId: data[0].email_id,
            track: data[0].track
        };
    }
    catch (error) {
        console.error('Error checking processed status:', error);
        return { processed: false };
    }
}
// Check if attachment already exists in database
async function checkAttachmentExists(supabase, emailId, filename) {
    try {
        const { data, error } = await supabase
            .from('attachments')
            .select('id') // Just select id
            .eq('email_id', emailId)
            .eq('filename', filename);
        if (error) {
            console.error('Error checking attachment:', error);
            return false;
        }
        return data && data.length > 0;
    }
    catch (error) {
        console.error('Error checking attachment:', error);
        return false;
    }
}
// Check if PDF page already exists in database
async function checkPdfPageExists(supabase, emailId, pdfFilename, pageNumber) {
    try {
        const { data, error } = await supabase
            .from('pdf_pages')
            .select('id') // Just select id
            .eq('email_id', emailId)
            .eq('pdf_filename', pdfFilename)
            .eq('page_number', pageNumber);
        if (error) {
            console.error('Error checking PDF page:', error);
            return false;
        }
        return data && data.length > 0;
    }
    catch (error) {
        console.error('Error checking PDF page:', error);
        return false;
    }
}
// Check if file exists in bucket
async function checkFileExistsInBucket(supabase, bucketName, filePath) {
    try {
        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .list(path.dirname(filePath), {
            limit: 1,
            offset: 0,
            search: path.basename(filePath)
        });
        if (error) {
            console.error(`Error checking file in bucket ${bucketName}:`, error);
            return false;
        }
        return data.some(file => file.name === path.basename(filePath));
    }
    catch (error) {
        console.error(`Error checking file in bucket ${bucketName}:`, error);
        return false;
    }
}
// Create buckets if they don't exist
async function ensureBucketsExist() {
    for (const bucketName of Object.values(BUCKET_NAMES)) {
        const { error } = await supabase.storage.getBucket(bucketName);
        if (error?.message?.includes('not found')) {
            console.log(`Creating bucket: ${bucketName}`);
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: false,
                fileSizeLimit: 52428800 // 50MB
            });
            if (createError) {
                console.error(`Error creating bucket ${bucketName}:`, createError);
            }
            else {
                console.log(`Successfully created bucket: ${bucketName}`);
            }
        }
        else {
            console.log(`Bucket exists: ${bucketName}`);
        }
    }
}
async function convertPDFToImages(pdfBuffer, baseFileName) {
    try {
        // Save PDF buffer to temp file
        const tempPdfPath = path.join(os.tmpdir(), `${baseFileName}.pdf`);
        await fs.writeFile(tempPdfPath, pdfBuffer);
        // Initialize the converter with the file path
        const convert = fromPath(tempPdfPath, PDF_TO_IMAGE_OPTIONS);
        // Convert all pages
        const result = await convert.bulk(-1, { responseType: "buffer" });
        // Clean up temp file
        await fs.unlink(tempPdfPath);
        // Format the results
        return result.map((page, index) => ({
            pageNumber: index + 1,
            imageBuffer: page.buffer
        }));
    }
    catch (error) {
        console.error('Error converting PDF to images:', error);
        return [];
    }
}
async function sanitizeFileName(fileName) {
    // Remove special characters and spaces, replace with underscores
    return fileName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/__+/g, '_')
        .toLowerCase();
}
async function processAttachment(emailId, attachment) {
    try {
        const sanitizedFilename = await sanitizeFileName(attachment.filename);
        // Check if attachment already exists
        const attachmentExists = await checkAttachmentExists(supabase, emailId, sanitizedFilename);
        if (attachmentExists) {
            console.log(`Attachment ${sanitizedFilename} already exists for email ${emailId}, skipping...`);
            return;
        }
        const bucketName = attachment.mimeType === 'application/pdf' ? BUCKET_NAMES.PDF : BUCKET_NAMES.ATTACHMENT;
        const filePath = `${emailId}/${sanitizedFilename}`;
        // Check if file already exists in bucket
        const fileExists = await checkFileExistsInBucket(supabase, bucketName, filePath);
        if (!fileExists) {
            // Upload file to appropriate bucket
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, attachment.data, {
                contentType: attachment.mimeType,
                upsert: false // Prevent overwriting existing files
            });
            if (uploadError) {
                throw uploadError;
            }
        }
        // Get public URL for the file
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
        try {
            // Try to insert attachment record with new schema
            const { error: dbError } = await supabase
                .from('attachments')
                .insert({
                email_id: emailId,
                filename: sanitizedFilename,
                content_type: attachment.mimeType,
                size: attachment.data.length,
                storage_path: filePath,
                public_url: publicUrl
            });
            if (dbError) {
                // If error is about missing columns, try inserting with minimal schema
                if (dbError.code === 'PGRST204') {
                    const { error: fallbackError } = await supabase
                        .from('attachments')
                        .insert({
                        email_id: emailId,
                        filename: sanitizedFilename
                    });
                    if (fallbackError) {
                        throw fallbackError;
                    }
                }
                else {
                    throw dbError;
                }
            }
        }
        catch (error) {
            console.error('Error inserting attachment record:', error);
            // Continue processing if there's a database error
        }
        // If it's a PDF, process its pages
        if (attachment.mimeType === 'application/pdf') {
            const options = {
                ...PDF_TO_IMAGE_OPTIONS,
                saveFilename: sanitizedFilename,
                density: 300,
                quality: 100,
                format: "png"
            };
            // Convert PDF to images
            const images = await convertPDFToImages(attachment.data, sanitizedFilename);
            // Process each page
            for (let i = 0; i < images.length; i++) {
                const pageNumber = i + 1;
                const imageFileName = `${sanitizedFilename}_page_${pageNumber}.jpg`;
                const imagePath = `${emailId}/${imageFileName}`;
                // Check if PDF page already exists
                const pageExists = await checkPdfPageExists(supabase, emailId, sanitizedFilename, pageNumber);
                if (pageExists) {
                    console.log(`PDF page ${pageNumber} for ${sanitizedFilename} already exists, skipping...`);
                    continue;
                }
                // Process the image with sharp for optimal quality and size
                const processedImageBuffer = await sharp(images[i].imageBuffer)
                    .jpeg({
                    quality: 95,
                    chromaSubsampling: '4:4:4'
                })
                    .withMetadata()
                    .toBuffer();
                // Check if image file exists in bucket
                const imageExists = await checkFileExistsInBucket(supabase, BUCKET_NAMES.IMAGE, imagePath);
                if (!imageExists) {
                    // Upload the processed image
                    const { error: imageUploadError } = await supabase.storage
                        .from(BUCKET_NAMES.IMAGE)
                        .upload(imagePath, processedImageBuffer, {
                        contentType: 'image/jpeg',
                        upsert: false
                    });
                    if (imageUploadError) {
                        throw imageUploadError;
                    }
                }
                // Get public URL for the image
                const { data: { publicUrl: imageUrl } } = supabase.storage
                    .from(BUCKET_NAMES.IMAGE)
                    .getPublicUrl(imagePath);
                try {
                    // Try to insert PDF page record with new schema
                    const { error: pageError } = await supabase
                        .from('pdf_pages')
                        .insert({
                        email_id: emailId,
                        pdf_filename: sanitizedFilename,
                        page_number: pageNumber,
                        image_url: imageUrl
                    });
                    if (pageError) {
                        // If error is about missing columns, try inserting with minimal schema
                        if (pageError.code === 'PGRST204') {
                            const { error: fallbackError } = await supabase
                                .from('pdf_pages')
                                .insert({
                                email_id: emailId,
                                pdf_filename: sanitizedFilename,
                                page_number: pageNumber
                            });
                            if (fallbackError) {
                                throw fallbackError;
                            }
                        }
                        else {
                            throw pageError;
                        }
                    }
                }
                catch (error) {
                    console.error('Error inserting PDF page record:', error);
                    // Continue processing if there's a database error
                }
            }
        }
    }
    catch (error) {
        console.error('Error processing attachment:', error);
        throw error;
    }
}
async function updateLabels(messageId, track) {
    try {
        // Get the message first to verify it exists
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId
        });
        if (!message || !message.data) {
            console.log(`Message ${messageId} not found or inaccessible, skipping label update`);
            return;
        }
        // Get label IDs
        const labelIds = await createLabelsIfNeeded(gmail);
        if (!labelIds) {
            console.error('Failed to get label IDs');
            return;
        }
        const labelToAdd = track === 'wotc_machine' ? labelIds[TRACK_LABELS.WOTC_MACHINE] : labelIds[TRACK_LABELS.FORMS_ADMIN];
        // Modify the message labels
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                addLabelIds: [labelToAdd]
            }
        });
        console.log(`Updated labels for processed email: ${messageId} to ${track === 'wotc_machine' ? TRACK_LABELS.WOTC_MACHINE : TRACK_LABELS.FORMS_ADMIN}`);
    }
    catch (error) {
        if (error.code === 400 && error.message?.includes('Precondition check failed')) {
            console.log(`Message ${messageId} is no longer accessible, skipping label update`);
            return;
        }
        console.error(`Error updating labels for message ${messageId}:`, error);
    }
}
// Function to extract domain from email
function extractDomain(email) {
    if (!email)
        return null;
    try {
        // Remove any whitespace and get everything after @
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
// Function to find client by email domain
async function findClientByDomain(email) {
    const domain = extractDomain(email);
    if (!domain)
        return { clientId: null, domain: null };
    try {
        // First try exact match
        const { data: exactMatch, error: exactError } = await supabase
            .from('email_domains')
            .select('client_ref_id, domain')
            .eq('domain', domain)
            .single();
        if (exactMatch) {
            return { clientId: exactMatch.client_ref_id, domain };
        }
        // If no exact match, try subdomain match
        // For example, if email is from sub.example.com, try to match example.com
        const parts = domain.split('.');
        if (parts.length > 2) {
            const parentDomain = parts.slice(-2).join('.');
            const { data: subMatch, error: subError } = await supabase
                .from('email_domains')
                .select('client_ref_id, domain')
                .eq('domain', parentDomain)
                .single();
            if (subMatch) {
                return { clientId: subMatch.client_ref_id, domain };
            }
        }
        return { clientId: null, domain };
    }
    catch (error) {
        console.error(`Error finding client for domain ${domain}:`, error);
        return { clientId: null, domain };
    }
}
async function processRecentEmails() {
    try {
        // Ensure all required buckets exist
        await ensureBucketsExist();
        // Create or get the track labels
        const labelIds = await createLabelsIfNeeded(gmail);
        if (!labelIds) {
            console.error('Failed to create or get labels');
            return;
        }
        // Get list of emails without any track labels
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 500,
            q: 'in:inbox' // Remove label filters to process all emails
        });
        if (!response.data || !response.data.messages) {
            console.log('No messages found');
            return;
        }
        // Sort messages by internalDate after fetching full details
        const messagePromises = response.data.messages.map(message => gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
        }));
        const messageDetails = await Promise.all(messagePromises);
        // Sort by internal date, newest first
        messageDetails.sort((a, b) => {
            const dateA = parseInt(a.data.internalDate || '0');
            const dateB = parseInt(b.data.internalDate || '0');
            return dateB - dateA;
        });
        // Process the messages
        for (const messageResponse of messageDetails) {
            const message = messageResponse.data;
            // Check if already processed
            const { processed, emailId, track: existingTrack } = await checkIfProcessed(supabase, message.id);
            // Get current labels
            const currentLabels = message.labelIds || [];
            const hasWotcLabel = currentLabels.includes(labelIds[TRACK_LABELS.WOTC_MACHINE]);
            const hasFormsLabel = currentLabels.includes(labelIds[TRACK_LABELS.FORMS_ADMIN]);
            // If email is processed, just update labels if needed
            if (processed && existingTrack) {
                const shouldBeWotc = existingTrack === 'wotc_machine';
                const correctLabelExists = shouldBeWotc ? hasWotcLabel : hasFormsLabel;
                if (!correctLabelExists) {
                    await updateLabels(message.id, existingTrack);
                }
                continue;
            }
            const headers = message.payload?.headers || [];
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const fromHeader = headers.find(h => h.name === 'From')?.value || '';
            // Parse from header into email and name
            const fromMatch = fromHeader.match(/^(?:"?([^"]*)"?\s)?<?([^>]*)>?$/);
            const fromName = fromMatch?.[1] || null;
            const fromEmail = fromMatch?.[2] || fromHeader;
            const date = new Date(parseInt(message.internalDate || '0'));
            // Look up client by email domain
            const { clientId, domain } = await findClientByDomain(fromEmail);
            // Get both HTML and text body
            const parts = message.payload?.parts || [message.payload];
            let bodyHtml = null;
            let bodyText = null;
            const findBody = (part) => {
                if (part.mimeType === 'text/html') {
                    bodyHtml = Buffer.from(part.body?.data || '', 'base64').toString();
                }
                else if (part.mimeType === 'text/plain') {
                    bodyText = Buffer.from(part.body?.data || '', 'base64').toString();
                }
                if (part.parts) {
                    part.parts.forEach(findBody);
                }
            };
            parts.forEach(findBody);
            // Insert email record with message_id
            const { data: emailData, error: emailError } = await supabase
                .from('emails')
                .insert({
                message_id: message.id,
                subject,
                from_name: fromName,
                from_email: fromEmail,
                from_domain: domain,
                client_id: clientId,
                date,
                body_html: bodyHtml,
                body_text: bodyText,
                snippet: message.snippet || '',
                processed: false,
                track: 'forms_admin', // Default to forms_admin, will update after checking attachments
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
                .select()
                .single();
            if (emailError) {
                console.error('Error inserting email:', emailError);
                continue;
            }
            // Process attachments if any
            let hasPdfAttachment = false;
            for (const part of parts) {
                if (part.body?.attachmentId) {
                    const attachment = await gmail.users.messages.attachments.get({
                        userId: 'me',
                        messageId: message.id,
                        id: part.body.attachmentId
                    });
                    // Check if this is a PDF attachment
                    if (part.mimeType === 'application/pdf') {
                        hasPdfAttachment = true;
                    }
                    const attachmentData = Buffer.from(attachment.data.data || '', 'base64');
                    await processAttachment(emailData.email_id, {
                        filename: part.filename || 'unnamed_attachment',
                        mimeType: part.mimeType || 'application/octet-stream',
                        data: attachmentData
                    });
                }
            }
            const track = hasPdfAttachment ? 'wotc_machine' : 'forms_admin';
            // Update email with track
            await supabase
                .from('emails')
                .update({
                processed: true,
                track
            })
                .eq('email_id', emailData.email_id);
            // Update labels
            await updateLabels(message.id, track);
            console.log(`Processed email: ${subject} (Track: ${track})`);
        }
        console.log('Email processing complete!');
    }
    catch (error) {
        console.error('Error processing emails:', error);
    }
}
// Run the script
processRecentEmails().catch(console.error);
