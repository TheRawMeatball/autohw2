SELECT u."id" as id,
    u."name" as username,
    "password_hash"
FROM "users" u
    INNER JOIN "classes" c ON u."class_id" = c."id"
WHERE u."name" = $1;