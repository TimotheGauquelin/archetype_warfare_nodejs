-- Script d'initialisation de la base de données
-- Ce script s'exécute en premier

-- Créer l'utilisateur admin s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
        CREATE USER admin WITH PASSWORD 'Azerty123!';
    END IF;
END
$$;

-- Donner tous les privilèges à admin
GRANT ALL PRIVILEGES ON DATABASE aw TO admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO admin;
