-- Limite de temps par question pour le défi du jour (0 = pas de chrono, max 30s)
ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS daily_time_limit_seconds INTEGER NOT NULL DEFAULT 0;

ALTER TABLE quiz_question
    DROP CONSTRAINT IF EXISTS chk_quiz_question_daily_time_limit;

ALTER TABLE quiz_question
    ADD CONSTRAINT chk_quiz_question_daily_time_limit
    CHECK (daily_time_limit_seconds >= 0 AND daily_time_limit_seconds <= 30);

-- Conservait auparavant un chrono fixe de 15s pour le daily
UPDATE quiz_question
SET daily_time_limit_seconds = 15
WHERE is_daily_question = TRUE
  AND daily_time_limit_seconds = 0;
