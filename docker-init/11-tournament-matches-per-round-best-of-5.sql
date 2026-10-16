-- Autorise Best of 5 (matches_per_round = 5), aligné sur le modèle Sequelize.
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
      AND pg_get_constraintdef(con.oid) ILIKE '%matches_per_round%'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE tournament DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

ALTER TABLE tournament
    ADD CONSTRAINT tournament_matches_per_round_check
    CHECK (matches_per_round IN (1, 3, 5));
