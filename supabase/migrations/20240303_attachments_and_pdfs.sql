-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id uuid REFERENCES public.emails(id),
    filename text NOT NULL,
    content_type text,
    size_bytes bigint,
    public_url text,
    storage_path text,
    is_processed boolean DEFAULT false,
    processing_error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb,
    hash text,
    original_filename text
);

-- Create pdf_pages table
CREATE TABLE IF NOT EXISTS public.pdf_pages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_id uuid REFERENCES public.attachments(id),
    page_number integer NOT NULL,
    text_content text,
    ocr_text text,
    form_type text,
    form_data jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb,
    confidence numeric,
    image_url text,
    preview_url text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON public.attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_attachments_filename ON public.attachments(filename);
CREATE INDEX IF NOT EXISTS idx_attachments_content_type ON public.attachments(content_type);
CREATE INDEX IF NOT EXISTS idx_attachments_is_processed ON public.attachments(is_processed);
CREATE INDEX IF NOT EXISTS idx_pdf_pages_attachment_id ON public.pdf_pages(attachment_id);
CREATE INDEX IF NOT EXISTS idx_pdf_pages_form_type ON public.pdf_pages(form_type);

-- Create triggers
CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_pages_updated_at
    BEFORE UPDATE ON public.pdf_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
