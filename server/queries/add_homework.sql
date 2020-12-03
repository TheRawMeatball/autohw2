INSERT INTO "homework"(
        "id",
        "detail",
        "subject",
        "class_id",
        "user_id",
        "amount",
        "due_date"
    )
VALUES (
        gen_random_uuid(),
        $1,
        $2,
        (
            select "class_id"
            from "users"
            where "id" = $3
        ),
        $4,
        $5,
        $6
    ) RETURNING "id";