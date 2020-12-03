UPDATE "refresh_tokens"
SET "last_used" = now()
WHERE "token" = $1 and "last_used" > $2 -- $2 = now() - expiry_duration
RETURNING "user_id" AS id; 