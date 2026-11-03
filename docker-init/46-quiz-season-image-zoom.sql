-- Zoom de l'illustration de saison (100 = 1×, max 250 = 2.5×)
ALTER TABLE quiz_season
    ADD COLUMN IF NOT EXISTS image_zoom SMALLINT NOT NULL DEFAULT 100;
