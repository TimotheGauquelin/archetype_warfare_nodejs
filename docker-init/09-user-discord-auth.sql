-- Auth Discord : liaison compte + provider
ALTER TABLE IF EXISTS "user"
    ADD COLUMN IF NOT EXISTS discord_id VARCHAR(32) NULL;

ALTER TABLE IF EXISTS "user"
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_discord_id
    ON "user" (discord_id)
    WHERE discord_id IS NOT NULL;