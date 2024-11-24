-- Create form_types table
CREATE TABLE IF NOT EXISTS public.form_types (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create form_classifications table
CREATE TABLE IF NOT EXISTS public.form_classifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type_id uuid REFERENCES public.form_types(id),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id uuid REFERENCES public.clients(id),
    first_name text,
    last_name text,
    middle_name text,
    email text,
    phone text,
    ssn text,
    address_line_1 text,
    address_line_2 text,
    city text,
    state text,
    zip_code text,
    date_of_birth date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb,
    status text DEFAULT 'pending',
    normalized_name text
);

-- Create hsc_8850_special_submissions table
CREATE TABLE IF NOT EXISTS public.hsc_8850_special_submissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id uuid REFERENCES public.applicants(id),
    client_id uuid REFERENCES public.clients(id),
    email_id uuid REFERENCES public.emails(id),
    attachment_id uuid REFERENCES public.attachments(id),
    pdf_page_id uuid REFERENCES public.pdf_pages(id),
    form_data jsonb,
    status text DEFAULT 'pending',
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb,
    submission_date date,
    processed_date timestamptz,
    form_type text,
    form_classification_id uuid REFERENCES public.form_classifications(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_form_types_name ON public.form_types(name);
CREATE INDEX IF NOT EXISTS idx_form_classifications_form_type_id ON public.form_classifications(form_type_id);
CREATE INDEX IF NOT EXISTS idx_applicants_client_id ON public.applicants(client_id);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);
CREATE INDEX IF NOT EXISTS idx_applicants_normalized_name ON public.applicants(normalized_name);
CREATE INDEX IF NOT EXISTS idx_hsc_8850_client_id ON public.hsc_8850_special_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_hsc_8850_applicant_id ON public.hsc_8850_special_submissions(applicant_id);
CREATE INDEX IF NOT EXISTS idx_hsc_8850_email_id ON public.hsc_8850_special_submissions(email_id);
CREATE INDEX IF NOT EXISTS idx_hsc_8850_status ON public.hsc_8850_special_submissions(status);
CREATE INDEX IF NOT EXISTS idx_hsc_8850_submission_date ON public.hsc_8850_special_submissions(submission_date);

-- Create triggers
CREATE TRIGGER update_form_types_updated_at
    BEFORE UPDATE ON public.form_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_classifications_updated_at
    BEFORE UPDATE ON public.form_classifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hsc_8850_updated_at
    BEFORE UPDATE ON public.hsc_8850_special_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
