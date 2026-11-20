-- Saison plateforme : rattacher les tournois + ledger de points circuit

ALTER TABLE tournament
    ADD COLUMN IF NOT EXISTS season_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_tournament_season'
    ) THEN
        ALTER TABLE tournament
            ADD CONSTRAINT fk_tournament_season
            FOREIGN KEY (season_id) REFERENCES quiz_season (id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tournament_season_id
    ON tournament (season_id)
    WHERE season_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS season_point_award (
    id BIGSERIAL PRIMARY KEY,
    season_id BIGINT NOT NULL REFERENCES quiz_season (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    source_type VARCHAR(30) NOT NULL,
    source_id VARCHAR(64) NULL,
    points INTEGER NOT NULL,
    reason VARCHAR(64) NOT NULL,
    meta JSONB NULL,
    created_at TIMESTAMPTZ NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
    CONSTRAINT chk_season_point_award_source_type
        CHECK (source_type IN ('tournament', 'quiz', 'manual'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_season_point_award_auto
    ON season_point_award (season_id, source_type, source_id, user_id, reason)
    WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_season_point_award_season_type
    ON season_point_award (season_id, source_type);

CREATE INDEX IF NOT EXISTS idx_season_point_award_user
    ON season_point_award (user_id);
