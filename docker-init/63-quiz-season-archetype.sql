-- Pool d'archétypes jouables par saison (tournois officiels rattachés)
-- Pool vide = tous les archétypes autorisés

CREATE TABLE IF NOT EXISTS quiz_season_archetype (
    season_id BIGINT NOT NULL,
    archetype_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (season_id, archetype_id),
    CONSTRAINT fk_quiz_season_archetype_season
        FOREIGN KEY (season_id) REFERENCES quiz_season (id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_season_archetype_archetype
        FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quiz_season_archetype_archetype
    ON quiz_season_archetype (archetype_id);
