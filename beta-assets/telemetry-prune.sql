DELETE FROM session_events WHERE received_at < datetime('now', '-90 days');
SELECT COUNT(*) AS remaining_events FROM session_events;
