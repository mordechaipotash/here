-- Get all columns from email_view
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'email_view'
ORDER BY ordinal_position;

-- Check the current email_view definition
SELECT 
    view_definition 
FROM information_schema.views 
WHERE table_name = 'email_view';

-- Check the columns in the view
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_view'
ORDER BY ordinal_position;
