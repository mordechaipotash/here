-- Create enum type for email processing status
CREATE TYPE email_processing_status AS ENUM ('unprocessed', 'pending', 'processed');

-- Add processing_status column to emails table
ALTER TABLE public.emails 
ADD COLUMN processing_status email_processing_status NOT NULL DEFAULT 'unprocessed';

-- Create index for faster querying
CREATE INDEX idx_emails_processing_status ON public.emails(processing_status);

-- Set existing emails to processed if they have attachments that are processed
UPDATE public.emails
SET processing_status = 'processed'
WHERE EXISTS (
    SELECT 1 
    FROM public.attachments a 
    WHERE a.email_id = emails.id 
    AND a.is_processed = true
);

-- Set existing emails to pending if they have attachments that are not processed
UPDATE public.emails
SET processing_status = 'pending'
WHERE EXISTS (
    SELECT 1 
    FROM public.attachments a 
    WHERE a.email_id = emails.id 
    AND a.is_processed = false
)
AND processing_status = 'unprocessed';

-- Add comment to explain the column
COMMENT ON COLUMN public.emails.processing_status IS 'Status of email processing: unprocessed (new emails), pending (being processed), processed (completed)';

-- Create function to update email processing status based on attachments
CREATE OR REPLACE FUNCTION update_email_processing_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent email's status when an attachment is modified
    UPDATE public.emails
    SET processing_status = 
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 
                FROM public.attachments 
                WHERE email_id = NEW.email_id
            ) THEN 'unprocessed'
            WHEN EXISTS (
                SELECT 1 
                FROM public.attachments 
                WHERE email_id = NEW.email_id 
                AND is_processed = false
            ) THEN 'pending'
            ELSE 'processed'
        END
    WHERE id = NEW.email_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update email status when attachments change
DROP TRIGGER IF EXISTS update_email_status_on_attachment_change ON public.attachments;
CREATE TRIGGER update_email_status_on_attachment_change
    AFTER INSERT OR UPDATE OF is_processed
    ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_email_processing_status();
