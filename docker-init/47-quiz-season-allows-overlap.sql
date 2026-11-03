-- Saison exceptionnelle : peut chevaucher une saison normale
ALTER TABLE quiz_season
    ADD COLUMN IF NOT EXISTS allows_overlap BOOLEAN NOT NULL DEFAULT FALSE;
