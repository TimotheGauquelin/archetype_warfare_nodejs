-- Script SQL pour modifier la table user basé sur le modèle Sequelize
-- Correspond au modèle UserModel.js
-- Version PostgreSQL

-- Vérifier si la table user existe et la modifier si nécessaire
DO $$
BEGIN
    -- Ajouter les contraintes d'unicité si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_user_username') THEN
        ALTER TABLE "user" ADD CONSTRAINT uk_user_username UNIQUE (username);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_user_email') THEN
        ALTER TABLE "user" ADD CONSTRAINT uk_user_email UNIQUE (email);
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user" (username);
CREATE INDEX IF NOT EXISTS idx_user_is_active ON "user" (is_active);
CREATE INDEX IF NOT EXISTS idx_user_is_banned ON "user" (is_banned);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "user" (created_at);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer le trigger s'il existe et le recréer
DROP TRIGGER IF EXISTS update_user_updated_at ON "user";
CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "user" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 