-- Check if form_types table exists and its structure
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'form_types'
);

-- Show form_types table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'form_types'
ORDER BY ordinal_position;

-- Check if form_classifications table exists and its structure
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'form_classifications'
);

-- Show form_classifications table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'form_classifications'
ORDER BY ordinal_position;

-- View all form types
SELECT * FROM form_types;

-- View form type keywords
SELECT 
    id,
    name,
    keywords
FROM form_types
WHERE keywords IS NOT NULL;

-- Check form classifications
SELECT 
    fc.id,
    fc.attachment_id,
    ft.name as form_type,
    fc.confidence_score,
    fc.manual_override,
    fc.created_at
FROM form_classifications fc
JOIN form_types ft ON fc.form_type_id = ft.id
ORDER BY fc.created_at DESC
LIMIT 10;

-- Check if keywords column exists in form_types
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'form_types'
   AND column_name = 'keywords'
);

-- Check indexes on form_types
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'form_types';

-- Check indexes on form_classifications
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'form_classifications';

-- Count of classifications by form type
SELECT 
    ft.name as form_type,
    COUNT(*) as total_classifications,
    COUNT(*) FILTER (WHERE fc.manual_override) as manual_overrides,
    AVG(fc.confidence_score) as avg_confidence
FROM form_classifications fc
JOIN form_types ft ON fc.form_type_id = ft.id
GROUP BY ft.name
ORDER BY total_classifications DESC;
