import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
// Load environment variables
dotenv.config({ path: '.env.local.dev' });
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// PDF processing endpoint
app.post('/process-pdf', async (req, res) => {
    try {
        const { attachment_id, file_name, content } = req.body;
        console.log('Processing PDF:', { attachment_id, file_name });
        // Convert base64 content to Buffer
        const buffer = Buffer.from(content, 'base64');
        // 1. Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(file_name, buffer, {
            contentType: 'application/pdf',
            upsert: true
        });
        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
        }
        // 2. Create pdf_pages entry
        const { data: pdfData, error: pdfError } = await supabase
            .from('pdf_pages')
            .insert({
            attachment_id: attachment_id,
            page_number: 1,
            content: `Processed content for ${file_name}`
        })
            .select()
            .single();
        if (pdfError) {
            console.error('PDF pages error:', pdfError);
            throw pdfError;
        }
        console.log('PDF processed successfully:', pdfData);
        res.json({ success: true, data: pdfData });
    }
    catch (error) {
        console.error('Error processing PDF:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Error processing PDF'
        });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`PDF processing server running on port ${PORT}`);
});
