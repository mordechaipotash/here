import { formClassificationService } from '../src/services/formClassificationService';
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
const { PDFDocument } = require('pdf-lib');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ... (keep existing initialization code)

async function extractTextFromPDF(pdfBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    let text = '';

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      // Extract text from each page
      // Note: This is a simplified version. For better text extraction,
      // consider using a more robust library like pdf.js or pdfjs-dist
      text += page.getText() + '\n';
    }

    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
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

    // Upload file if it doesn't exist
    const fileExists = await checkFileExistsInBucket(supabase, bucketName, filePath);
    if (!fileExists) {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, attachment.data, {
          contentType: attachment.mimeType,
          upsert: false
        });

      if (uploadError) throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Insert attachment record
    const { data: attachmentRecord, error: attachmentError } = await supabase
      .from('attachments')
      .insert({
        email_id: emailId,
        filename: sanitizedFilename,
        content_type: attachment.mimeType,
        size: attachment.data.length,
        storage_path: filePath,
        public_url: publicUrl
      })
      .select()
      .single();

    if (attachmentError) throw attachmentError;

    // Process PDF specific tasks
    if (attachment.mimeType === 'application/pdf') {
      // Extract text from PDF
      const pdfText = await extractTextFromPDF(attachment.data);
      
      // Classify the form based on extracted text
      const classification = await formClassificationService.classifyText(pdfText);
      
      if (classification) {
        // Save the classification
        await formClassificationService.saveClassification(
          attachmentRecord.id,
          classification
        );
        
        console.log(`Classified ${sanitizedFilename} as form type ${classification.formTypeId} with confidence ${classification.confidenceScore}`);
      }

      // Process PDF pages as before
      const images = await convertPDFToImages(attachment.data, sanitizedFilename);
      
      for (let i = 0; i < images.length; i++) {
        // ... (keep existing PDF page processing code)
      }
    }

    return attachmentRecord;
  } catch (error) {
    console.error('Error processing attachment:', error);
    throw error;
  }
}

// ... (keep rest of the existing code)

// Run the script
processRecentEmails().catch(console.error);
