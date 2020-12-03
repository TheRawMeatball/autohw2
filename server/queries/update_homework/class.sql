UPDATE homework
SET "amount" = COALESCE ($1, "amount"),
    "detail" = COALESCE ($2, "detail"),
    "due_date" = COALESCE ($3, "due_date"),
    "subject" = COALESCE ($4, "subject")
WHERE homework."id" = $5;