-- Chrono daily + points quizz utilisateur

ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS quiz_points INT NOT NULL DEFAULT 0;

ALTER TABLE quiz_attempt
    ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP NULL;
