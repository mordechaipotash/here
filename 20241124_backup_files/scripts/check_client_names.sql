-- Get all distinct client names from the clients table
SELECT DISTINCT client_name 
FROM clients 
WHERE client_name IS NOT NULL 
ORDER BY client_name;
