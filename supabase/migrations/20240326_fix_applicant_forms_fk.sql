-- First drop the existing foreign key constraint
ALTER TABLE public.applicant_forms 
DROP CONSTRAINT IF EXISTS applicant_forms_page_id_fkey;

-- Add the correct foreign key constraint referencing pdf_pages
ALTER TABLE public.applicant_forms 
ADD CONSTRAINT applicant_forms_page_id_fkey 
FOREIGN KEY (page_id) 
REFERENCES public.pdf_pages(id);
