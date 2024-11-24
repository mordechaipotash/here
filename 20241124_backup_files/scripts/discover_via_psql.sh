#!/bin/bash

# Database URL from .env.local
DB_URL="postgresql://postgres.yawnfaxeamfxketynfdt:Mord4680613!@aws-0-eu-central-1.pooler.supabase.co:6543/postgres"

# Run the discovery queries
PGPASSWORD=Mord4680613! psql "$DB_URL" -f discover_database.sql > database_structure.txt

echo "Database structure has been saved to database_structure.txt"
