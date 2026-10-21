-- Niveau de difficulté des questions de quizz

ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) NOT NULL DEFAULT 'medium';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_quiz_question_difficulty'
    ) THEN
        ALTER TABLE quiz_question
            ADD CONSTRAINT chk_quiz_question_difficulty
            CHECK (difficulty IN ('easy', 'medium', 'hard'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_question_difficulty
    ON quiz_question (difficulty);
