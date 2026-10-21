-- Une question Daily = un jour précis dans une saison

ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS scheduled_date DATE NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_question_season_scheduled_date
    ON quiz_question (season_id, scheduled_date)
    WHERE season_id IS NOT NULL AND scheduled_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_question_scheduled_date
    ON quiz_question (scheduled_date)
    WHERE scheduled_date IS NOT NULL;
