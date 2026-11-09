-- Mots-clés admin pour retrouver rapidement une question
ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_quiz_question_keywords
    ON quiz_question USING GIN (keywords);
