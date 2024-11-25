-- Setup core tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table first as it's referenced by other tables
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id text UNIQUE,
    client_name text,
    company_name text NOT NULL,
    display_color text DEFAULT '#E2E8F0',
    status text DEFAULT 'active',
    numeric_id serial,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON public.clients(client_id);

-- Create emails table (base table for email functionality)
CREATE TABLE IF NOT EXISTS public.emails (
    email_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id text UNIQUE,
    thread_id text,
    from_email text,
    from_name text,
    to_email text[],
    cc_email text[],
    bcc_email text[],
    subject text,
    snippet text,
    body_text text,
    body_html text,
    received_at timestamptz,
    date timestamptz,
    processed boolean DEFAULT false,
    client_ref_id uuid REFERENCES public.clients(id),
    track boolean DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for emails
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON public.emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_client_ref_id ON public.emails(client_ref_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON public.emails(received_at);

-- Create email_domains table for domain management
CREATE TABLE IF NOT EXISTS public.email_domains (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain text NOT NULL UNIQUE,
    client_ref_id uuid NOT NULL REFERENCES public.clients(id),
    is_primary boolean DEFAULT false,
    notes text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for email_domains
CREATE INDEX IF NOT EXISTS idx_email_domains_domain ON public.email_domains(domain);
CREATE INDEX IF NOT EXISTS idx_email_domains_client_ref_id ON public.email_domains(client_ref_id);

-- Create form_types table for form classification
CREATE TABLE IF NOT EXISTS public.form_types (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create form_classifications table
CREATE TABLE IF NOT EXISTS public.form_classifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type_id uuid REFERENCES public.form_types(id),
    confidence float,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for form_classifications
CREATE INDEX IF NOT EXISTS idx_form_classifications_form_type_id ON public.form_classifications(form_type_id);

-- Create config table for application settings
CREATE TABLE IF NOT EXISTS public.config (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key text UNIQUE NOT NULL,
    value jsonb,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create email_view for simplified email querying
CREATE OR REPLACE VIEW public.email_view AS
SELECT 
    e.email_id,
    e.message_id,
    e.from_email,
    e.from_name,
    e.subject,
    e.snippet,
    e.body_text,
    e.body_html,
    e.received_at,
    e.date,
    e.processed,
    e.created_at,
    e.updated_at,
    e.track,
    COALESCE(e.client_ref_id, ed.client_ref_id) as client_ref_id,
    c.client_id,
    c.client_name,
    c.company_name,
    COALESCE(c.client_name, c.company_name, split_part(e.from_email, '@', 2)) as display_name,
    COALESCE(c.display_color, '#E2E8F0') as label_color
FROM emails e
LEFT JOIN email_domains ed ON split_part(e.from_email, '@', 2) = ed.domain
LEFT JOIN clients c ON COALESCE(e.client_ref_id, ed.client_ref_id) = c.id;

-- Create email_statistics view
CREATE OR REPLACE VIEW public.email_statistics AS
SELECT 
    date_trunc('day', e.received_at) as day,
    COUNT(*) as total_emails,
    COUNT(DISTINCT e.from_email) as unique_senders,
    COUNT(DISTINCT e.thread_id) as unique_threads
FROM emails e
GROUP BY date_trunc('day', e.received_at)
ORDER BY day DESC;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at
            BEFORE UPDATE ON public.clients
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_emails_updated_at') THEN
        CREATE TRIGGER update_emails_updated_at
            BEFORE UPDATE ON public.emails
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_domains_updated_at') THEN
        CREATE TRIGGER update_email_domains_updated_at
            BEFORE UPDATE ON public.email_domains
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_types_updated_at') THEN
        CREATE TRIGGER update_form_types_updated_at
            BEFORE UPDATE ON public.form_types
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_classifications_updated_at') THEN
        CREATE TRIGGER update_form_classifications_updated_at
            BEFORE UPDATE ON public.form_classifications
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_config_updated_at') THEN
        CREATE TRIGGER update_config_updated_at
            BEFORE UPDATE ON public.config
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END$$;
