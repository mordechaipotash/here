-- Add keywords column to form_types table
ALTER TABLE public.form_types ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}';

-- Create index on keywords for better search performance
CREATE INDEX IF NOT EXISTS idx_form_types_keywords ON public.form_types USING gin(keywords);

-- Grant necessary permissions
GRANT ALL ON public.form_types TO authenticated;
GRANT ALL ON public.form_types TO service_role;
