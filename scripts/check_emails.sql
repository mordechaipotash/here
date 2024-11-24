-- Query to check emails table
SELECT COUNT(*) as email_count FROM emails;

-- Sample of emails
SELECT id, email_id, date, subject, client_id 
FROM emails 
ORDER BY date DESC 
LIMIT 5;
