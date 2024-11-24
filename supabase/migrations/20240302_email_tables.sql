-- Create email_domains table
CREATE TABLE IF NOT EXISTS public.email_domains (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain text NOT NULL UNIQUE,
    client_id uuid REFERENCES public.clients(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create emails table
CREATE TABLE IF NOT EXISTS public.emails (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id uuid REFERENCES public.clients(id),
    from_email text,
    to_email text,
    subject text,
    body_text text,
    body_html text,
    received_date timestamptz,
    message_id text,
    in_reply_to text,
    references text[],
    status email_status DEFAULT 'pending',
    error_message text,
    source text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    thread_id text,
    cc text[],
    bcc text[],
    raw_email text,
    raw_headers jsonb,
    parsed_data jsonb,
    processed_data jsonb,
    metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_domains_domain ON public.email_domains(domain);
CREATE INDEX IF NOT EXISTS idx_email_domains_client_id ON public.email_domains(client_id);
CREATE INDEX IF NOT EXISTS idx_emails_client_id ON public.emails(client_id);
CREATE INDEX IF NOT EXISTS idx_emails_from_email ON public.emails(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_received_date ON public.emails(received_date);
CREATE INDEX IF NOT EXISTS idx_emails_status ON public.emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON public.emails(thread_id);

-- Create email_view
CREATE OR REPLACE VIEW public.email_view AS
SELECT 
    e.*,
    c.client_name,
    c.company_name
FROM public.emails e
LEFT JOIN public.clients c ON e.client_id = c.id;

-- Create email_statistics view
CREATE OR REPLACE VIEW public.email_statistics AS
SELECT 
    client_id,
    status,
    COUNT(*) as count,
    MIN(received_date) as earliest_date,
    MAX(received_date) as latest_date
FROM public.emails
GROUP BY client_id, status;

-- Create triggers for updated_at
CREATE TRIGGER update_email_domains_updated_at
    BEFORE UPDATE ON public.email_domains
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
    BEFORE UPDATE ON public.emails
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
