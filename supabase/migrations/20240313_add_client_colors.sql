-- Add display_color column if it doesn't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_color text;

-- Update display colors for each client
UPDATE clients SET display_color = 
  CASE client_name
    WHEN 'Empeon Group' THEN '#4CAF50'  -- Green
    WHEN 'Royal Care Group' THEN '#2196F3'  -- Blue
    WHEN 'Heart to Heart' THEN '#9C27B0'  -- Purple
    WHEN 'Five Star Group' THEN '#FF9800'  -- Orange
    WHEN 'Ahava Group' THEN '#E91E63'  -- Pink
    WHEN 'BNV' THEN '#00BCD4'  -- Cyan
    WHEN 'First Quality Electric' THEN '#FF5722'  -- Deep Orange
    ELSE '#607D8B'  -- Blue Grey (default)
  END
WHERE display_color IS NULL;

-- Update the email_view to use the client's display_color
CREATE OR REPLACE VIEW email_view AS
SELECT 
  e.email_id,
  e.message_id,
  e.date,
  e.subject,
  e.snippet,
  e.body_html,
  e.from_email,
  e.from_name,
  e.client_id,
  e.created_at,
  e.updated_at,
  e.track,
  c.client_name,
  c.company_name,
  c.display_color,
  a.id as attachment_id,
  a.filename,
  a.content_type,
  a.size,
  a.storage_path,
  a.file_path,
  a.public_url
FROM emails e
LEFT JOIN clients c ON e.client_id = c.id
LEFT JOIN attachments a ON a.email_id = e.email_id;
