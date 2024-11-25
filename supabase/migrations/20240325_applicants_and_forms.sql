-- Create applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id uuid REFERENCES public.emails(email_id),
    first_name text NOT NULL,
    last_name text NOT NULL,
    ssn text NOT NULL,
    dob date NOT NULL,
    street1 text NOT NULL,
    street2 text,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    email text,
    phone text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    duplicate_status text DEFAULT 'new',
    duplicate_confidence float,
    original_applicant_id uuid REFERENCES public.applicants(id)
);

-- Create applicant_forms table to track form assignments
CREATE TABLE IF NOT EXISTS public.applicant_forms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id uuid REFERENCES public.applicants(id) NOT NULL,
    page_id uuid REFERENCES public.pdf_pages(id) NOT NULL,
    form_type text NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(page_id) -- Each page can only be assigned to one applicant
);

-- Create applicant_duplicate_history table
CREATE TABLE IF NOT EXISTS public.applicant_duplicate_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_applicant_id uuid REFERENCES public.applicants(id),
    duplicate_applicant_id uuid REFERENCES public.applicants(id),
    resolution_type text NOT NULL,
    resolution_reason text,
    confidence_score float,
    resolved_by uuid REFERENCES auth.users(id),
    resolved_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applicants_email_id ON public.applicants(email_id);
CREATE INDEX IF NOT EXISTS idx_applicants_ssn ON public.applicants(ssn);
CREATE INDEX IF NOT EXISTS idx_applicants_duplicate_status ON public.applicants(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_applicant_forms_applicant_id ON public.applicant_forms(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_forms_page_id ON public.applicant_forms(page_id);
CREATE INDEX IF NOT EXISTS idx_applicant_duplicate_history_original ON public.applicant_duplicate_history(original_applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_duplicate_history_duplicate ON public.applicant_duplicate_history(duplicate_applicant_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applicant_forms_updated_at
    BEFORE UPDATE ON public.applicant_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_duplicate_history ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow authenticated users to view applicants"
    ON public.applicants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert applicants"
    ON public.applicants FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update applicants"
    ON public.applicants FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view applicant forms"
    ON public.applicant_forms FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert applicant forms"
    ON public.applicant_forms FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update applicant forms"
    ON public.applicant_forms FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view duplicate history"
    ON public.applicant_duplicate_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert duplicate history"
    ON public.applicant_duplicate_history FOR INSERT
    TO authenticated
    WITH CHECK (true);
