-- Create email_field_status view
CREATE OR REPLACE VIEW public.email_field_status AS
WITH email_counts AS (
    SELECT
        COUNT(*) as total_emails,
        COUNT(NULLIF(from_email, '')) as has_from_email,
        COUNT(NULLIF(from_name, '')) as has_from_name,
        COUNT(NULLIF(subject, '')) as has_subject,
        COUNT(NULLIF(snippet, '')) as has_snippet,
        COUNT(NULLIF(body_text, '')) as has_body_text,
        COUNT(NULLIF(body_html, '')) as has_body_html,
        COUNT(NULLIF(received_at, NULL)) as has_received_at,
        COUNT(NULLIF(date, NULL)) as has_date,
        COUNT(NULLIF(client_ref_id, NULL)) as has_client_ref_id,
        COUNT(NULLIF(track, NULL)) as has_track
    FROM public.emails
)
SELECT
    'from_email' as field,
    has_from_email as count,
    ROUND((has_from_email::float / total_emails::float) * 100, 2) as percentage
FROM email_counts
UNION ALL
SELECT
    'from_name',
    has_from_name,
    ROUND((has_from_name::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'subject',
    has_subject,
    ROUND((has_subject::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'snippet',
    has_snippet,
    ROUND((has_snippet::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'body_text',
    has_body_text,
    ROUND((has_body_text::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'body_html',
    has_body_html,
    ROUND((has_body_html::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'received_at',
    has_received_at,
    ROUND((has_received_at::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'date',
    has_date,
    ROUND((has_date::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'client_ref_id',
    has_client_ref_id,
    ROUND((has_client_ref_id::float / total_emails::float) * 100, 2)
FROM email_counts
UNION ALL
SELECT
    'track',
    has_track,
    ROUND((has_track::float / total_emails::float) * 100, 2)
FROM email_counts
ORDER BY percentage DESC;
