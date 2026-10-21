-- Quizz du jour : 1 question globale (tous thèmes), unique par date

-- Une seule entrée daily par jour
DELETE FROM quiz_daily a
USING quiz_daily b
WHERE a.quiz_date = b.quiz_date
  AND a.id > b.id;

ALTER TABLE quiz_daily DROP CONSTRAINT IF EXISTS uq_quiz_daily_date_theme;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_daily_date
    ON quiz_daily (quiz_date);

-- Une tentative daily par user et par jour (plus de thème)
DELETE FROM quiz_attempt a
USING quiz_attempt b
WHERE a.mode = 'daily'
  AND b.mode = 'daily'
  AND a.user_id = b.user_id
  AND a.daily_date IS NOT DISTINCT FROM b.daily_date
  AND a.started_at < b.started_at;

DROP INDEX IF EXISTS uq_quiz_attempt_daily_user;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_attempt_daily_user
    ON quiz_attempt (user_id, daily_date)
    WHERE mode = 'daily' AND daily_date IS NOT NULL;

-- Recréer les dailies du jour avec exactement 1 question du pool global
DELETE FROM quiz_daily WHERE quiz_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::date;
