-- Point focal + zoom de l'illustration tournoi (highlight officiel)
ALTER TABLE tournament
    ADD COLUMN IF NOT EXISTS image_focal_x SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE tournament
    ADD COLUMN IF NOT EXISTS image_focal_y SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE tournament
    ADD COLUMN IF NOT EXISTS image_zoom SMALLINT NOT NULL DEFAULT 100;
