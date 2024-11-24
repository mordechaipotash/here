-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE account_status AS ENUM ('Active', 'Inactive', 'Pending', 'Suspended');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
        CREATE TYPE email_status AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
END$$;

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id text,
    client_name text NOT NULL,
    normalized_name text,
    company_name text NOT NULL,
    company_fein text,
    company_phone text,
    company_contact_name text,
    address_line_1 text,
    address_line_2 text,
    city text,
    state text,
    zip_code text,
    account_status account_status DEFAULT 'Active',
    signed_poa boolean DEFAULT false,
    signed_by text,
    wotc_poa_valid text,
    percentage numeric,
    states_company_registered text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    display_color varchar(7) DEFAULT '#E2E8F0',
    numeric_id text,
    status text NOT NULL DEFAULT 'Active'
);

-- Create config table
CREATE TABLE IF NOT EXISTS public.config (
    key text PRIMARY KEY,
    value text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON public.clients(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_normalized_name ON public.clients(normalized_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_key ON public.config(key);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for clients table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_clients_updated_at'
    ) THEN
        CREATE TRIGGER update_clients_updated_at
            BEFORE UPDATE ON public.clients
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END$$;
