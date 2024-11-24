-- Drop the existing view
DROP VIEW IF EXISTS email_view;

-- Recreate the view with label_color
CREATE OR REPLACE VIEW email_view AS
SELECT 
    e.email_id,
    e.message_id,
    e.from_email,
    e.from_name,
    e.subject,
    e.snippet,
    e.body_text,
    e.body_html,
    e.received_at,
    e.date,
    e.processed,
    e.created_at,
    e.updated_at,
    e.track,
    COALESCE(e.client_ref_id, ed.client_ref_id) AS client_ref_id,
    c.client_id,
    c.client_name,
    c.company_name,
    COALESCE(c.client_name, c.company_name, split_part(e.from_email, '@'::text, 2)) AS display_name,
    COALESCE(c.label_color, '#E2E8F0'::character varying) AS label_color
FROM emails e
LEFT JOIN email_domains ed ON split_part(e.from_email, '@'::text, 2) = ed.domain
LEFT JOIN clients c ON COALESCE(e.client_ref_id, ed.client_ref_id) = c.id;
