UPDATE
	specific_homework
SET
	"delta_date" = now(),
	"progress" = "progress" + "delta",
	"delta" = '0'
WHERE
	"delta_date" <= (now() - (INTERVAL '24H' + make_interval(secs => (
		SELECT "offset" FROM "users" WHERE "id" = $1
	))))
	AND "user_id" = $1;