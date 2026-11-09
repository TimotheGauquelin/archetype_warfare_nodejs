-- Description libre du tournoi (Markdown léger côté front : gras / italique / retours à la ligne)
ALTER TABLE tournament
    ADD COLUMN IF NOT EXISTS description TEXT NULL;
