-- Rang tournoi de saison figé en fin de saison (souvenir)

CREATE TABLE IF NOT EXISTS season_tournament_rank_snapshot (
    id BIGSERIAL PRIMARY KEY,
    season_id BIGINT NOT NULL REFERENCES quiz_season (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    leaderboard_rank INTEGER NOT NULL,
    tournaments_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NULL DEFAULT NOW(),
    CONSTRAINT uq_season_tournament_rank_snapshot UNIQUE (season_id, user_id),
    CONSTRAINT chk_season_tournament_rank_tier CHECK (
        tier IN (
            'novice',
            'bronze',
            'argent',
            'or',
            'platine',
            'diamant',
            'master'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_season_tournament_rank_snapshot_season
    ON season_tournament_rank_snapshot (season_id, leaderboard_rank);
