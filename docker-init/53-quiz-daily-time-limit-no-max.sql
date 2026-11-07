-- Chrono daily : plus de plafond à 30s ; défaut 30 secondes (0 = pas de chrono)
ALTER TABLE quiz_question
    DROP CONSTRAINT IF EXISTS chk_quiz_question_daily_time_limit;

ALTER TABLE quiz_question
    ADD CONSTRAINT chk_quiz_question_daily_time_limit
    CHECK (daily_time_limit_seconds >= 0);

ALTER TABLE quiz_question
    ALTER COLUMN daily_time_limit_seconds SET DEFAULT 30;
