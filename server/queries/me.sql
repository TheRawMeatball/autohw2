SELECT u."name" AS username,
    c."name" AS class_name,
    u."weights",
    u."offset"
FROM users u
    INNER JOIN classes c ON c."id" = u."class_id"
where u."id" = $1;