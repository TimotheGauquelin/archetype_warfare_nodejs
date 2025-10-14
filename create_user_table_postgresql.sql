-- Script SQL pour créer la table user basé sur le modèle Sequelize
-- Correspond au modèle UserModel.js
-- Version PostgreSQL

CREATE TABLE "user" (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    reset_password_token TEXT,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    has_accepted_terms_and_conditions BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes d'unicité
ALTER TABLE "user" ADD CONSTRAINT uk_user_username UNIQUE (username);
ALTER TABLE "user" ADD CONSTRAINT uk_user_email UNIQUE (email);

-- Index pour optimiser les recherches
CREATE INDEX idx_user_email ON "user" (email);
CREATE INDEX idx_user_username ON "user" (username);
CREATE INDEX idx_user_is_active ON "user" (is_active);
CREATE INDEX idx_user_is_banned ON "user" (is_banned);
CREATE INDEX idx_user_created_at ON "user" (created_at);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "user" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 