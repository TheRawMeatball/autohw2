UPDATE "specific_homework" SET "deleted" = 'true' WHERE "homework_id" = $1 and "user_id" = $2;