-- Description libre de saison (Markdown léger côté front : gras / italique / carte / retours à la ligne)
ALTER TABLE quiz_season
    ADD COLUMN IF NOT EXISTS description TEXT NULL;
