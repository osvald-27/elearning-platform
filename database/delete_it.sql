SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE  datname = 'elearning_platform'
	AND pid<> pg_backend_pid();