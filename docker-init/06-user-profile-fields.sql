-- Biography + preferred archetype on user profile
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS biography TEXT NULL;

ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS loved_archetype_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_user_loved_archetype'
    ) THEN
        ALTER TABLE "user"
            ADD CONSTRAINT fk_user_loved_archetype
            FOREIGN KEY (loved_archetype_id)
            REFERENCES archetype (id)
            ON DELETE SET NULL;
    END IF;
END $$;
