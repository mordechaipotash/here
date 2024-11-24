-- Create applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id uuid REFERENCES public.emails(email_id),
    first_name text,
    last_name text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    zip text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create hsc_8850_special_submissions table
CREATE TABLE IF NOT EXISTS public.hsc_8850_special_submissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id uuid REFERENCES public.applicants(id),
    submission_date timestamptz,
    status text,
    notes text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applicants_email_id ON public.applicants(email_id);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);
CREATE INDEX IF NOT EXISTS idx_hsc_8850_special_submissions_applicant_id ON public.hsc_8850_special_submissions(applicant_id);
CREATE INDEX IF NOT EXISTS idx_hsc_8850_special_submissions_status ON public.hsc_8850_special_submissions(status);

-- Create triggers for updating timestamps
CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hsc_8850_special_submissions_updated_at
    BEFORE UPDATE ON public.hsc_8850_special_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
