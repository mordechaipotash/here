#!/bin/bash

# Database connection string
DATABASE_URL="postgresql://postgres.yawnfaxeamfxketynfdt:Mord4680613!@aws-0-eu-central-1.pooler.supabase.co:6543/postgres"

# Function to execute SQL and save results
execute_query() {
    psql "$DATABASE_URL" -c "$1"
}

echo "Inspecting emails table structure..."
execute_query "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'emails'
ORDER BY ordinal_position;"

echo -e "\nChecking if email_view exists..."
execute_query "
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public';"

echo -e "\nListing all tables in public schema..."
execute_query "
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;"
