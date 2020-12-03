DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--TABLES START
CREATE TABLE "classes" (
    "id" uuid NOT NULL,
    "name" TEXT NOT NULL UNIQUE,
    CONSTRAINT "PK_classes" PRIMARY KEY ("id")
);
CREATE TABLE "users" (
    "id" uuid NOT NULL,
    "class_id" uuid NOT NULL,
    "name" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "weights" INTEGER[7] NOT NULL,
    CONSTRAINT "PK_users" PRIMARY KEY ("id"),
    CONSTRAINT "FK_61" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON
DELETE RESTRICT
);
CREATE TABLE "refresh_tokens" (
    "token" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "last_used" timestamp NOT NULL,
    CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("token"),
    CONSTRAINT "FK_126" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON
DELETE CASCADE
);
CREATE TABLE "homework" (
    "id" uuid NOT NULL,
    "class_id" uuid NULL,
    "user_id" uuid NULL,
    "amount" integer NULL,
    "due_date" date NOT NULL,
    "detail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    CONSTRAINT "PK_homework" PRIMARY KEY ("id"),
    CONSTRAINT "FK_115" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON
DELETE CASCADE,
    CONSTRAINT "FK_71" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON
	DELETE RESTRICT
);
CREATE TABLE "specific_homework" (
    "user_id" uuid NOT NULL,
    "homework_id" uuid NOT NULL,
    "amount" integer NULL,
    "progress" integer NOT NULL,
    "weight" integer NOT NULL,
    "delta" integer NOT NULL,
    "delta_date" date NOT NULL,
    "deleted" boolean NOT NULL,
    "extended_due_date" date,
    CONSTRAINT "PK_table_88" PRIMARY KEY ("user_id", "homework_id"),
    CONSTRAINT "FK_89" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON
DELETE CASCADE,
    CONSTRAINT "FK_93" FOREIGN KEY ("homework_id") REFERENCES "homework" ("id") ON
	DELETE CASCADE
);
CREATE INDEX "fkIdx_61" ON "users" ("class_id");
CREATE INDEX "fkIdx_126" ON "refresh_tokens" ("user_id");
CREATE INDEX "fkIdx_115" ON "homework" ("user_id");
CREATE INDEX "fkIdx_71" ON "homework" ("class_id");
CREATE INDEX "fkIdx_89" ON "specific_homework" ("user_id");
CREATE INDEX "fkIdx_93" ON "specific_homework" ("homework_id");
--TABLES END
CREATE OR REPLACE FUNCTION new_user (uname TEXT, cname TEXT, phash TEXT) RETURNS TABLE (rid uuid) AS $block$ BEGIN IF NOT (
        EXISTS (
            SELECT 1
            FROM "users" u
            WHERE u."name" = uname
        )
    ) THEN RETURN query WITH ins AS (
        INSERT INTO "classes" ("id", "name")
        VALUES (gen_random_uuid(), cname) -- input value
            ON CONFLICT("name") DO NOTHING
        RETURNING "id"
    )   
INSERT INTO "users" ("name", "id", "password_hash", "class_id", "weights")
VALUES (
        uname,
        gen_random_uuid(),
        phash,
        (
            SELECT "id"
            FROM ins
            UNION ALL
            SELECT c."id"
            FROM classes c -- 2nd SELECT never executed if INSERT successful
            WHERE c."name" = cname -- input value a 2nd time
            LIMIT 1
        ),
        '{1,1,1,1,1,1,1}'
    )
RETURNING "id";
END IF;
END;
$block$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user (uname TEXT, cname TEXT, phash TEXT, whts INTEGER[7], uid UUID) 
	RETURNS TABLE (username TEXT, class_name TEXT, _weights INTEGER[7]) AS $block$ BEGIN
UPDATE "users"
SET
	"name" = COALESCE (uname, "name"),
	"password_hash" = COALESCE (phash, "password_hash"),
	"weights" = COALESCE (whts, "weights")
WHERE 
	"id" = uid;
IF cname IS NOT NULL THEN
WITH ins AS (
    INSERT INTO "classes" 
	("id", "name")
	VALUES (gen_random_uuid(), cname)
		ON CONFLICT("name") DO NOTHING
	RETURNING "id"
)
UPDATE "users"
SET
	"class_id" = (
		SELECT "id"
		FROM ins 
		UNION ALL
		SELECT c."id"
		FROM classes c
		WHERE c."name" = cname
		LIMIT 1
	)
WHERE 
	"id" = uid;
END IF;
RETURN QUERY SELECT u."name", c."name", u."weights" FROM
"users" u
INNER JOIN classes c
ON c."id" = u."class_id"
WHERE u.id = uid;
END;
$block$ LANGUAGE plpgsql;