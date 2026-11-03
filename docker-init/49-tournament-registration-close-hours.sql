-- Délai (en heures) avant le début pour fermer auto. les inscriptions (défaut 48)
ALTER TABLE tournament
    ADD COLUMN IF NOT EXISTS registration_close_hours_before INT NOT NULL DEFAULT 48;
