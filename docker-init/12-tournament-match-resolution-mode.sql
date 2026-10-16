-- Mode de résolution des matchs : victoire stricte (premier à N) ou meilleur score.
ALTER TABLE IF EXISTS tournament
    ADD COLUMN IF NOT EXISTS match_resolution_mode VARCHAR(30) NOT NULL DEFAULT 'strict_wins';

DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT con.conname
    INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'tournament'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%match_resolution_mode%'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE tournament DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

ALTER TABLE tournament
    ADD CONSTRAINT tournament_match_resolution_mode_check
    CHECK (match_resolution_mode IN ('strict_wins', 'highest_score'));
