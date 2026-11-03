-- Image d'illustration (carte cropped) pour le highlight des tournois officiels
ALTER TABLE tournament
    ADD COLUMN IF NOT EXISTS image_url TEXT NULL;
