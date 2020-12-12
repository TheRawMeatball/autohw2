ALTER TABLE "users" DROP COLUMN IF EXISTS "offset";
ALTER TABLE "users"
ADD COLUMN "offset" INTEGER NOT NULL DEFAULT 0;
DROP FUNCTION IF EXISTS "update_user";
CREATE OR REPLACE FUNCTION update_user (
        uname TEXT,
        cname TEXT,
        phash TEXT,
        whts INTEGER [7],
        offst INTEGER,
        uid UUID
    ) RETURNS TABLE (
        "username" TEXT,
        "class_name" TEXT,
        "_weights" INTEGER [7],
        "_offset" INTEGER
    ) AS $block$ BEGIN
UPDATE "users"
SET "name" = COALESCE (uname, "name"),
    "password_hash" = COALESCE (phash, "password_hash"),
    "weights" = COALESCE (whts, "weights"),
    "offset" = COALESCE (offst, "offset")
WHERE "id" = uid;
IF cname IS NOT NULL THEN WITH ins AS (
    INSERT INTO "classes" ("id", "name")
    VALUES (gen_random_uuid(), cname) ON CONFLICT("name") DO NOTHING
    RETURNING "id"
)
UPDATE "users"
SET "class_id" = (
        SELECT "id"
        FROM ins
        UNION ALL
        SELECT c."id"
        FROM classes c
        WHERE c."name" = cname
        LIMIT 1
    )
WHERE "id" = uid;
END IF;
RETURN QUERY
SELECT u."name",
    c."name",
    u."weights",
    u."offset"
FROM "users" u
    INNER JOIN classes c ON c."id" = u."class_id"
WHERE u.id = uid;
END;
$block$ LANGUAGE plpgsql;