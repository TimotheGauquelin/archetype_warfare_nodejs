-- Un daily (et une tentative) par saison et par jour

ALTER TABLE quiz_attempt
    ADD COLUMN IF NOT EXISTS season_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_quiz_attempt_season'
    ) THEN
        ALTER TABLE quiz_attempt
            ADD CONSTRAINT fk_quiz_attempt_season
            FOREIGN KEY (season_id) REFERENCES quiz_season (id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Rattache les tentatives daily existantes à la saison du quiz_daily du jour
UPDATE quiz_attempt a
SET season_id = d.season_id
FROM quiz_daily d
WHERE a.mode = 'daily'
  AND a.daily_date IS NOT NULL
  AND a.daily_date = d.quiz_date
  AND a.season_id IS NULL
  AND d.season_id IS NOT NULL;

-- Si plusieurs questions sur un même daily (fusion ancienne), ne garder que la 1ʳᵉ
-- Les dailys exceptionnels seront recréés à la volée par l'API.
UPDATE quiz_daily
SET question_ids = question_ids[1:1]
WHERE cardinality(question_ids) > 1;

DROP INDEX IF EXISTS uq_quiz_daily_date;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_daily_date_season
    ON quiz_daily (quiz_date, season_id);

DROP INDEX IF EXISTS uq_quiz_attempt_daily_user;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_attempt_daily_user_season
    ON quiz_attempt (user_id, daily_date, season_id)
    WHERE mode = 'daily' AND daily_date IS NOT NULL AND season_id IS NOT NULL;
