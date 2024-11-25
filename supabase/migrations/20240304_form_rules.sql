-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing constraints and triggers if they exist
DROP TRIGGER IF EXISTS set_timestamp ON public.form_classification_rules;
ALTER TABLE IF EXISTS public.form_classification_rules DROP CONSTRAINT IF EXISTS unique_form_type_id;
DROP INDEX IF EXISTS idx_form_classification_rules_form_type_id;

-- Create form_classification_rules table
CREATE TABLE IF NOT EXISTS public.form_classification_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type_id uuid REFERENCES public.form_types(id),
    keywords text[] NOT NULL DEFAULT '{}',
    required_fields text[] NOT NULL DEFAULT '{}',
    filename_patterns text[] NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for form_classification_rules
CREATE INDEX IF NOT EXISTS idx_form_classification_rules_form_type_id ON public.form_classification_rules(form_type_id);

-- Create unique constraint to ensure only one rule set per form type
ALTER TABLE public.form_classification_rules ADD CONSTRAINT unique_form_type_id UNIQUE (form_type_id);

-- Create trigger for updating timestamps
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.form_classification_rules
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS
ALTER TABLE public.form_classification_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to all users" ON public.form_classification_rules;
DROP POLICY IF EXISTS "Allow insert/update/delete for authenticated users only" ON public.form_classification_rules;

-- Create policies
CREATE POLICY "Allow read access to all users"
    ON public.form_classification_rules
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow insert/update/delete for authenticated users only"
    ON public.form_classification_rules
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
