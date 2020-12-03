INSERT INTO "specific_homework" (
		"user_id",
		"homework_id",
		"progress",
		"delta",
		"delta_date",
		"weight",
		"deleted"
	)
SELECT $1,
	h."id",
	'0',
	'0',
	now(),
	'1',
	'false'
FROM "homework" h
WHERE NOT EXISTS (
		SELECT 1
		FROM "specific_homework" sh
		WHERE sh."user_id" = $1
			AND sh."homework_id" = h."id"
	);