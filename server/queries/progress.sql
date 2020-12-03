UPDATE
	specific_homework
SET
	"delta" = GREATEST (0, LEAST( COALESCE("amount", (SELECT "amount" FROM homework h WHERE "homework_id" = h.id )), "delta" + $1 ))
WHERE
	"homework_id" = $2
	AND "user_id" = $3;