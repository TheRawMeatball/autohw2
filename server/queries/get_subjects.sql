SELECT "subject"
FROM "homework"
WHERE "class_id" = (
        SELECT "class_id"
        FROM "users"
        WHERE "id" = $1
    )
    OR "user_id" = $1;