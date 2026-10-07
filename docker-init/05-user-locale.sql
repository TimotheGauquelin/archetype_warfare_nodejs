-- Migration idempotente : langue préférée utilisateur (mails + UI)
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS locale VARCHAR(5) NOT NULL DEFAULT 'fr';

UPDATE "user"
SET locale = 'fr'
WHERE locale IS NULL OR locale = '';
