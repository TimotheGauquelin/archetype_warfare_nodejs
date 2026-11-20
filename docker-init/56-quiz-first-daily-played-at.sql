-- Date de première sortie réelle en Daily (historique admin)
ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS first_daily_played_at TIMESTAMP NULL;

-- Backfill depuis quiz_daily
UPDATE quiz_question q
SET first_daily_played_at = sub.first_date
FROM (
    SELECT q2.id AS question_id, MIN(d.quiz_date)::timestamp AS first_date
    FROM quiz_question q2
    INNER JOIN quiz_daily d ON q2.id = ANY (d.question_ids)
    GROUP BY q2.id
) sub
WHERE q.id = sub.question_id
  AND q.first_daily_played_at IS NULL;

-- Fallback si déjà marquée was_daily sans ligne daily
UPDATE quiz_question
SET first_daily_played_at = COALESCE(
    scheduled_date::timestamp,
    updated_at,
    created_at,
    CURRENT_TIMESTAMP
)
WHERE was_daily_question = TRUE
  AND first_daily_played_at IS NULL;
