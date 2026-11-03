-- Point focal de l'illustration de saison (object-position, 0–100 %)
ALTER TABLE quiz_season
    ADD COLUMN IF NOT EXISTS image_focal_x SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE quiz_season
    ADD COLUMN IF NOT EXISTS image_focal_y SMALLINT NOT NULL DEFAULT 50;
