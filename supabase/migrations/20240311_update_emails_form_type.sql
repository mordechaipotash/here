-- Add form_type column to emails table if it doesn't exist
ALTER TABLE public.emails 
ADD COLUMN IF NOT EXISTS form_type text DEFAULT 'unclassified';

-- Set default value for form_type column
ALTER TABLE public.emails 
ALTER COLUMN form_type SET DEFAULT 'unclassified';

-- Update existing null values to 'unclassified'
UPDATE public.emails 
SET form_type = 'unclassified' 
WHERE form_type IS NULL;
