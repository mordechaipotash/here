-- Add form_type column to pdf_pages table
ALTER TABLE public.pdf_pages 
ADD COLUMN IF NOT EXISTS form_type text DEFAULT 'unclassified';
