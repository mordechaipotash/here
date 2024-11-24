-- Update client colors in the clients table
UPDATE clients
SET label_color = 
  CASE client_name
    WHEN 'Five Star Group' THEN '#FED7AA'
    WHEN 'Empeon Group' THEN '#BFDBFE'
    WHEN 'Royal Care Group' THEN '#BBF7D0'
    WHEN 'Heart to Heart' THEN '#FECACA'
    WHEN 'Ahava Group' THEN '#DDD6FE'
    WHEN 'BNV' THEN '#FDE68A'
    WHEN 'Future Care' THEN '#99F6E4'
    WHEN 'Hcs Group' THEN '#FBCFE8'
    WHEN 'First Quality Electric' THEN '#e5d0bc'
    WHEN 'Bluebird Group' THEN '#93C5FD'
    WHEN 'Priority Group' THEN '#C7D2FE'
    WHEN 'Staff Pro' THEN '#A5B4FC'
    WHEN 'The W Group' THEN '#F9A8D4'
    WHEN 'Uder Group' THEN '#FCA5A5'
    WHEN 'Pbs Group' THEN '#A7F3D0'
    WHEN 'Eas' THEN '#FDE047'
    WHEN 'Moisha''s Group' THEN '#FDA4AF'
    WHEN 'HDA' THEN '#D8B4FE'
    ELSE '#E2E8F0' -- Default gray for unknown clients
  END
WHERE client_name IS NOT NULL;
