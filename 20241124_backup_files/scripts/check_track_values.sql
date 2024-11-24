SELECT DISTINCT track, COUNT(*) as count
FROM email_view
GROUP BY track
ORDER BY count DESC;
