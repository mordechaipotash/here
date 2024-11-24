#!/bin/bash

SUPABASE_URL="https://yawnfaxeamfxketynfdt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd25mYXhlYW1meGtldHluZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDY3NjI4NSwiZXhwIjoyMDQ2MjUyMjg1fQ.J4clFE9uMlMab5_8U8117m4qN23GXgF-Y0INDnoJSGk"

# Function to make a request to Supabase
query_supabase() {
    local query="$1"
    curl -s -X POST \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: params=single-object" \
        -d "{\"query\": $(echo "$query" | jq -R -s '.')}" \
        "$SUPABASE_URL/rest/v1/rpc/discover_schema"
}

# Read and execute the SQL query
SQL_QUERY=$(cat discover_schema.sql)
query_supabase "$SQL_QUERY" | jq '.'
