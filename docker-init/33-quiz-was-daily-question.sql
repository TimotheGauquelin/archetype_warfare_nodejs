-- Renomme is_daily_question → was_daily_question
-- (question déjà utilisée en Daily : non replanifiable)

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'quiz_question'
          AND column_name = 'is_daily_question'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'quiz_question'
          AND column_name = 'was_daily_question'
    ) THEN
        ALTER TABLE quiz_question
            RENAME COLUMN is_daily_question TO was_daily_question;
    END IF;
END $$;

ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS was_daily_question BOOLEAN NOT NULL DEFAULT FALSE;
