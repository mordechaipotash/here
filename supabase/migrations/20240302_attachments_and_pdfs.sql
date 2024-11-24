-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id uuid REFERENCES public.emails(email_id),
    filename text,
    content_type text,
    size bigint,
    storage_path text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create pdf_pages table
CREATE TABLE IF NOT EXISTS public.pdf_pages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_id uuid REFERENCES public.attachments(id),
    page_number integer,
    content text,
    form_classification_id uuid REFERENCES public.form_classifications(id),
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON public.attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_pdf_pages_attachment_id ON public.pdf_pages(attachment_id);
CREATE INDEX IF NOT EXISTS idx_pdf_pages_form_classification_id ON public.pdf_pages(form_classification_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_pages_updated_at
    BEFORE UPDATE ON public.pdf_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
