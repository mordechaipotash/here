-- Drop existing index if it exists
DROP INDEX IF EXISTS public.idx_emails_thread_id;

-- Add thread_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'emails' 
        AND column_name = 'thread_id'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN thread_id text;
    END IF;
END $$;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON public.emails(thread_id);
