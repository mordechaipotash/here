-- Check if label_color column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'label_color'
    ) THEN
        -- Add label_color column if it doesn't exist
        ALTER TABLE clients 
        ADD COLUMN label_color VARCHAR(7) DEFAULT '#E2E8F0';
    END IF;
END $$;
