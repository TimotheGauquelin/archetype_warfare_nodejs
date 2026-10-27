-- Aligne was_daily_question sur le cycle de vie réel :
-- true  = déjà sortie dans un quiz_daily (passé ou du jour)
-- false = jamais sortie en Daily (y compris questions seulement planifiées)

-- 1) Dé-brûler les questions marquées à tort à la planification seule
UPDATE quiz_question q
SET was_daily_question = FALSE
WHERE q.was_daily_question = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM quiz_daily d
      WHERE q.id = ANY (d.question_ids)
  );

-- 2) Brûler définitivement celles déjà présentes dans un Daily passé/du jour
UPDATE quiz_question q
SET was_daily_question = TRUE
WHERE EXISTS (
      SELECT 1
      FROM quiz_daily d
      WHERE d.quiz_date <= CURRENT_DATE
        AND q.id = ANY (d.question_ids)
  );
