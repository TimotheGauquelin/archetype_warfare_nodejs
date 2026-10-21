-- Marque les questions éligibles au défi du jour
ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS is_daily_question BOOLEAN NOT NULL DEFAULT FALSE;

-- Conserver le pool daily existant : les questions déjà actives
-- restent éligibles jusqu'à réglage admin
UPDATE quiz_question
SET is_daily_question = TRUE
WHERE is_active = TRUE
  AND type IN ('mcq', 'true_false');
