-- Check if RLS is enabled for emails table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'emails';

-- Check existing RLS policies
SELECT *
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'emails';
