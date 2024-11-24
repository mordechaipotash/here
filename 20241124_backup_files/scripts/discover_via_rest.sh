#!/bin/bash

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    exit 1
fi

# Function to make authenticated requests to Supabase
query_db() {
    local query="$1"
    curl -X POST \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}" \
        "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query" 
}

# Read the SQL file
SQL_CONTENT=$(cat discover_database.sql)

# Execute the query
query_db "$SQL_CONTENT" > discover_results.json

echo "Database structure has been saved to discover_results.json"
