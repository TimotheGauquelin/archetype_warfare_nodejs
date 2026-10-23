-- Tournoi officiel : compte pour le classement des maîtres d'archétype
ALTER TABLE tournament
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT FALSE;
