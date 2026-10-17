-- Horodatage explicite d'un score saisi (BYE inclus dès la création).
ALTER TABLE IF EXISTS tournament_match
    ADD COLUMN IF NOT EXISTS result_reported_at TIMESTAMP NULL;

-- Backfill : matchs déjà completed (dont BYE) sont considérés comme score renseigné.
UPDATE tournament_match
SET result_reported_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE status = 'completed'
  AND result_reported_at IS NULL;
