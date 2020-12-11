SELECT "username" AS "username!",
    "class_name" AS "class_name!",
    "_weights" AS "weights!",
    "_offset" AS "offset!"
FROM update_user($1, $2, $3, $4, $5, $6);