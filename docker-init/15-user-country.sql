-- Nationalité utilisateur (ISO 3166-1 alpha-2, ex. FR, JP).
ALTER TABLE IF EXISTS "user"
    ADD COLUMN IF NOT EXISTS country VARCHAR(2) NULL;
