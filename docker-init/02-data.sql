-- Script SQL pour insérer des données de test
-- Les tables sont déjà créées par 01-schema.sql

-- Insérer les rôles
INSERT INTO role (label) VALUES 
('Admin'),
('User');

-- Insérer des utilisateurs de test
INSERT INTO "user" (username, password, email, is_active, is_banned, has_accepted_terms_and_conditions) VALUES
('admin', '$2b$10$example_hash', 'admin@example.com', true, false, true),
('testuser', '$2b$10$example_hash', 'test@example.com', true, false, true),
('inactive_user', '$2b$10$example_hash', 'inactive@example.com', false, false, false);

-- Assigner des rôles aux utilisateurs
INSERT INTO user_role (user_id, role_id) VALUES
(1, 1), -- admin a le rôle Admin
(2, 2), -- testuser a le rôle User
(3, 2); -- inactive_user a le rôle User