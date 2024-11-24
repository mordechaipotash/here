-- Set default value for form_type column
ALTER TABLE public.pdf_pages 
ALTER COLUMN form_type SET DEFAULT 'unclassified';

-- Update existing null values to 'unclassified'
UPDATE public.pdf_pages 
SET form_type = 'unclassified' 
WHERE form_type IS NULL;
