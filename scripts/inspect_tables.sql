-- Inspect email_view table
SELECT *
FROM email_view
LIMIT 1;

-- Inspect attachments table
SELECT *
FROM attachments
LIMIT 1;

-- Inspect pdf_pages table
SELECT *
FROM pdf_pages
LIMIT 1;

-- Find all records where form_type is not null and not unclassified
SELECT 
    id,
    email_id,
    pdf_filename,
    page_number,
    form_type,
    created_at,
    image_url
FROM pdf_pages 
WHERE form_type IS NOT NULL 
AND form_type != 'unclassified'
ORDER BY created_at DESC;
