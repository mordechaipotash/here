-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'emails';

-- Check distinct sources if the column exists
SELECT DISTINCT source, COUNT(*) 
FROM emails 
WHERE source IS NOT NULL 
GROUP BY source;
