#!/bin/bash

# Database connection details
DB_HOST="aws-0-eu-central-1.pooler.supabase.co"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.yawnfaxeamfxketynfdt"
DB_PASSWORD="Mord4680613!"

# Function to execute SQL and save results
execute_query() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$1"
}

echo "Inspecting email_view structure..."
execute_query "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'email_view'
ORDER BY ordinal_position;"

echo -e "\nInspecting email_view definition..."
execute_query "
SELECT definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'email_view';"

echo -e "\nInspecting emails table structure..."
execute_query "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'emails'
ORDER BY ordinal_position;"
