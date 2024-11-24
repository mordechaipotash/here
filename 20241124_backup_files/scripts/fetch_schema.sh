#!/bin/bash

# Supabase details
SUPABASE_URL="https://yawnfaxeamfxketynfdt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd25mYXhlYW1meGtldHluZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDY3NjI4NSwiZXhwIjoyMDQ2MjUyMjg1fQ.J4clFE9uMlMab5_8U8117m4qN23GXgF-Y0INDnoJSGk"

echo "Fetching emails table structure..."
curl -X GET \
  "$SUPABASE_URL/rest/v1/emails?select=*&limit=0" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation"

echo -e "\n\nFetching email_view structure..."
curl -X GET \
  "$SUPABASE_URL/rest/v1/email_view?select=*&limit=0" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation"
