-- Check for tables with 'attachment' or 'pdf' in their name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%attach%' OR table_name LIKE '%pdf%';
