-- Ajoute le statut "Pas eu lieu" pour les tournois jamais démarrés après la date.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT con.conname
    INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'tournament'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE tournament DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

ALTER TABLE tournament
    ADD CONSTRAINT tournament_status_check
    CHECK (
        status IN (
            'registration_open',
            'registration_closed',
            'tournament_beginning',
            'tournament_in_progress',
            'tournament_finished',
            'tournament_cancelled',
            'tournament_did_not_happen'
        )
    );
