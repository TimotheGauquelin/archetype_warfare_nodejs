-- Intention admin : question pour le Daily (pool) vs question libre.
-- was_daily_question reste un historique (« déjà sortie au moins une fois »).

ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS for_daily BOOLEAN NOT NULL DEFAULT FALSE;

-- Créneaux encore planifiés et pas encore sortis → pool Daily
UPDATE quiz_question q
SET for_daily = TRUE
WHERE q.season_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM quiz_daily d
      WHERE d.quiz_date <= CURRENT_DATE
        AND q.id = ANY (d.question_ids)
  );

-- Déjà sorties en Daily → libres + historique
UPDATE quiz_question q
SET for_daily = FALSE,
    was_daily_question = TRUE,
    season_id = NULL,
    scheduled_date = NULL
WHERE EXISTS (
      SELECT 1
      FROM quiz_daily d
      WHERE d.quiz_date <= CURRENT_DATE
        AND q.id = ANY (d.question_ids)
  );
