UPDATE specific_homework sh
SET "amount" = COALESCE ($1, "amount"),
    "weight" = COALESCE ($2, "weight"),
    "extended_due_date" = COALESCE ($3, "extended_due_date")
WHERE sh."homework_id" = $4 and sh."user_id" = $5;