SELECT h."id",
	h."detail",
	h."subject",
	h."due_date",
	sh."progress",
	sh."delta",
	sh."weight",
	COALESCE (sh."amount", h."amount") AS "amount",
	h.user_id IS NOT NULL AS "personal!",
	sh."extended_due_date"
FROM "homework" h
	LEFT OUTER JOIN "specific_homework" sh ON h."id" = sh."homework_id"
WHERE sh."user_id" = $1
	AND (
		h."user_id" = $1
		OR h."class_id" = (
			SELECT u."class_id"
			FROM "users" u
			WHERE u."id" = $1
		)
	)
	AND NOT sh."deleted";