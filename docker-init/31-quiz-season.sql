-- Saisons de Daily Quizz (~3 mois) + liaison questions / daily

CREATE TABLE IF NOT EXISTS quiz_season (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quiz_season_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_quiz_season_dates
    ON quiz_season (start_date, end_date);

ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS season_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_quiz_question_season'
    ) THEN
        ALTER TABLE quiz_question
            ADD CONSTRAINT fk_quiz_question_season
            FOREIGN KEY (season_id) REFERENCES quiz_season (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_question_season
    ON quiz_question (season_id)
    WHERE season_id IS NOT NULL;

ALTER TABLE quiz_daily
    ADD COLUMN IF NOT EXISTS season_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_quiz_daily_season'
    ) THEN
        ALTER TABLE quiz_daily
            ADD CONSTRAINT fk_quiz_daily_season
            FOREIGN KEY (season_id) REFERENCES quiz_season (id) ON DELETE SET NULL;
    END IF;
END $$;
