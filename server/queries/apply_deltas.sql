UPDATE
	specific_homework
SET
	"delta_date" = now(),
	"progress" = "progress" + "delta",
	"delta" = '0'
WHERE
	"delta_date" <= (now() - INTERVAL '32 hour')
	AND "user_id" = $1;