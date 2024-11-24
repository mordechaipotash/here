-- Check table existence and column definitions
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('email_domains', 'email_domain_mappings', 'clients')
ORDER BY table_name, ordinal_position;

-- Check foreign key relationships
SELECT
    tc.table_name as table_name,
    kcu.column_name as column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('email_domains', 'email_domain_mappings');

-- Check actual data in email_domains
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT domain) as unique_domains,
    COUNT(DISTINCT client_ref_id) as unique_clients
FROM email_domains;

-- Check actual data in email_domain_mappings
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT domain) as unique_domains,
    COUNT(DISTINCT client_ref_id) as unique_clients,
    COUNT(DISTINCT client_id) as unique_client_ids
FROM email_domain_mappings;

-- Check for overlapping domains
SELECT 
    COALESCE(ed.domain, edm.domain) as domain,
    ed.client_ref_id as ed_client_ref,
    edm.client_ref_id as edm_client_ref,
    c1.client_name as ed_client_name,
    c2.client_name as edm_client_name
FROM email_domains ed
FULL OUTER JOIN email_domain_mappings edm ON ed.domain = edm.domain
LEFT JOIN clients c1 ON ed.client_ref_id = c1.id
LEFT JOIN clients c2 ON edm.client_ref_id = c2.id
WHERE ed.domain IS NULL OR edm.domain IS NULL
    OR ed.client_ref_id != edm.client_ref_id
LIMIT 10;

-- Check which table is actually being used in the email view
SELECT 
    view_definition 
FROM information_schema.views 
WHERE table_name = 'email_view';
