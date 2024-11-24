-- Update email_view to include processing_status and pdf_pages
CREATE OR REPLACE VIEW public.email_view AS
WITH pdf_pages_json AS (
  SELECT 
    a.email_id,
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'attachment_id', p.attachment_id,
        'page_number', p.page_number,
        'image_url', p.image_url,
        'form_type', p.form_type
      )
    ) as pdf_pages
  FROM public.attachments a
  JOIN public.pdf_pages p ON p.attachment_id = a.id
  GROUP BY a.email_id
)
SELECT 
    e.id,
    e.email_id,
    e.date,
    e.subject,
    e.snippet,
    e.source,
    e.client_id,
    e.created_at,
    e.updated_at,
    e.track,
    e.processing_status,
    c.client_name,
    c.company_name,
    ppj.pdf_pages
FROM public.emails e
LEFT JOIN public.clients c ON e.client_id = c.id
LEFT JOIN pdf_pages_json ppj ON ppj.email_id = e.email_id;
