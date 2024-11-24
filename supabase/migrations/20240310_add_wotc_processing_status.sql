-- Create enum type for WOTC processing status
CREATE TYPE wotc_processing_status AS ENUM ('unprocessed', 'processed', 'followup');

-- Add processing_status column to emails table
ALTER TABLE public.emails 
ADD COLUMN processing_status wotc_processing_status;

-- Set default status for WOTC emails to unprocessed
UPDATE public.emails
SET processing_status = 'unprocessed'
WHERE track = 'wotc_machine';

-- Add a trigger to automatically set status for new WOTC emails
CREATE OR REPLACE FUNCTION set_wotc_processing_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.track = 'wotc_machine' THEN
        NEW.processing_status = 'unprocessed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_wotc_status_on_insert
    BEFORE INSERT ON public.emails
    FOR EACH ROW
    EXECUTE FUNCTION set_wotc_processing_status();
