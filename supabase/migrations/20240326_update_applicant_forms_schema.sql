-- First, let's drop any existing foreign key constraints
ALTER TABLE public.applicant_forms 
DROP CONSTRAINT IF EXISTS applicant_forms_page_id_fkey;

-- Add the form_type column if it doesn't exist
ALTER TABLE public.applicant_forms 
ADD COLUMN IF NOT EXISTS form_type text;

-- Add the foreign key constraint to pdf_pages
ALTER TABLE public.applicant_forms 
ADD CONSTRAINT applicant_forms_page_id_fkey 
FOREIGN KEY (page_id) 
REFERENCES public.pdf_pages(id);

-- Update the existing records to copy form_type from pdf_pages
UPDATE public.applicant_forms af
SET form_type = pp.form_type
FROM public.pdf_pages pp
WHERE af.page_id = pp.id
AND af.form_type IS NULL;
