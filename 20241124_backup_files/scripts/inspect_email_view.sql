-- Get column information for email_view
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'email_view'
ORDER BY ordinal_position;

-- Get view definition
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'email_view';
