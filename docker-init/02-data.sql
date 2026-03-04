-- ==========================================
-- SEED : données initiales
-- Exécuté à l'initialisation Docker (après 01-schema.sql)
-- ==========================================

-- Era
INSERT INTO era (id, label) VALUES
    (1, 'DM'),
    (2, 'GX'),
    (3, '5DS'),
    (4, 'ZEXAL'),
    (5, 'ARC-V'),
    (6, 'VRAINS'),
    (7, 'MODERN'),
    (8, 'CHRONICLES')
ON CONFLICT (id) DO NOTHING;

-- Attribute
INSERT INTO attribute (id, label) VALUES
    (1, 'LIGHT'),
    (2, 'DARK'),
    (3, 'WATER'),
    (4, 'FIRE'),
    (5, 'EARTH'),
    (6, 'WIND'),
    (7, 'DIVINE')
ON CONFLICT (id) DO NOTHING;

-- Type
INSERT INTO type (id, label) VALUES
    (1, 'Dragon'),
    (2, 'Spellcaster'),
    (3, 'Warrior'),
    (4, 'Beast'),
    (5, 'Beast-Warrior'),
    (6, 'Fiend'),
    (7, 'Fairy'),
    (8, 'Insect'),
    (9, 'Dinosaur'),
    (10, 'Reptile'),
    (11, 'Fish'),
    (12, 'Sea Serpent'),
    (13, 'Aqua'),
    (14, 'Pyro'),
    (15, 'Thunder'),
    (16, 'Rock'),
    (17, 'Plant'),
    (18, 'Machine'),
    (19, 'Psychic'),
    (20, 'Wyrm'),
    (21, 'Cyberse'),
    (22, 'Divine-Beast')
ON CONFLICT (id) DO NOTHING;

-- Summon mechanic
INSERT INTO summonmechanic (id, label) VALUES
    (1, 'Special Summon'),
    (2, 'Tribute Summon'),
    (3, 'Fusion Summon'),
    (4, 'Ritual Summon'),
    (5, 'Synchro Summon'),
    (6, 'Xyz Summon'),
    (7, 'Pendulum Summon'),
    (8, 'Link Summon')
ON CONFLICT (id) DO NOTHING;

-- Card status
INSERT INTO card_status (id, label, "limit") VALUES
    (1, 'Forbidden', 0),
    (2, 'Limited', 1),
    (3, 'Semi-Limited', 2),
    (4, 'Unlimited', 3)
ON CONFLICT (id) DO NOTHING;

-- Card type
INSERT INTO card_type (id, label, num_order) VALUES
    (1, 'Normal Monster', 1),
    (2, 'Normal Tuner Monster', 2),
    (3, 'Effect Monster', 3),
    (4, 'Tuner Monster', 4),
    (5, 'Flip Monster', 5),
    (6, 'Flip Effect Monster', 6),
    (7, 'Spirit Monster', 7),
    (8, 'Union Effect Monster', 8),
    (9, 'Gemini Monster', 9),
    (16, 'Toon Monster', 10),
    (10, 'Pendulum Normal Monster', 11),
    (11, 'Pendulum Effect Monster', 12),
    (24, 'Pendulum Flip Effect Monster', 13),
    (13, 'Pendulum Tuner Effect Monster', 14),
    (14, 'Ritual Monster', 15),
    (15, 'Ritual Effect Monster', 16),
    (12, 'Pendulum Effect Ritual Monster', 17),
    (17, 'Fusion Monster', 18),
    (25, 'Pendulum Effect Fusion Monster', 19),
    (18, 'Synchro Monster', 20),
    (19, 'Synchro Tuner Monster', 21),
    (20, 'Synchro Pendulum Effect Monster', 22),
    (21, 'XYZ Monster', 23),
    (22, 'XYZ Pendulum Effect Monster', 24),
    (23, 'Link Monster', 25),
    (26, 'Normal Spell', 26),
    (27, 'Field Spell', 27),
    (28, 'Equip Spell', 28),
    (29, 'Continuous Spell', 29),
    (30, 'Quick-Play Spell', 30),
    (31, 'Ritual Spell', 31),
    (32, 'Normal Trap', 32),
    (33, 'Continuous Trap', 33),
    (34, 'Counter Trap', 34)
ON CONFLICT (id) DO NOTHING;

-- Archetype (dépend de era)
INSERT INTO archetype (id, name, main_info, slider_info, is_highlighted, is_active, in_tcg_date, in_aw_date, popularity_poll, era_id) VALUES
    (1, 'Blue Eyes', 'A strong archetype focused on dragons.', 'Slider for Dragon Clan', TRUE, TRUE, '2021-05-01', '2021-06-01', 1000, 1),
    (2, 'Dark Magicien', 'Spellcaster-focused archetype.', 'Slider for Magician Circle', FALSE, TRUE, '2020-09-15', '2020-10-01', 850, 1)
ON CONFLICT (id) DO NOTHING;

-- Liaisons archetype
INSERT INTO archetype_attribute (archetype_id, attribute_id) VALUES
    (1, 1),
    (2, 2);

INSERT INTO archetype_type (archetype_id, type_id) VALUES
    (1, 1),
    (2, 2);

INSERT INTO archetype_summonmechanic (archetype_id, summonmechanic_id) VALUES
    (1, 2),
    (2, 2);

-- Rôles
INSERT INTO role (id, label) VALUES
    (1, 'Admin'),
    (2, 'User')
ON CONFLICT (id) DO NOTHING;

-- Utilisateurs de test
INSERT INTO "user" (id, username, password, email, is_active, is_banned, has_accepted_terms_and_conditions) VALUES
    (1, 'admin', '$2b$10$example_hash', 'admin@example.com', TRUE, FALSE, TRUE),
    (2, 'testuser', '$2b$10$example_hash', 'test@example.com', TRUE, FALSE, TRUE),
    (3, 'inactive_user', '$2b$10$example_hash', 'inactive@example.com', FALSE, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Liaisons user / role (idempotent sans contrainte UNIQUE)
INSERT INTO user_role (user_id, role_id)
SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM user_role WHERE user_id = 1 AND role_id = 1)
UNION ALL SELECT 2, 2 WHERE NOT EXISTS (SELECT 1 FROM user_role WHERE user_id = 2 AND role_id = 2)
UNION ALL SELECT 3, 2 WHERE NOT EXISTS (SELECT 1 FROM user_role WHERE user_id = 3 AND role_id = 2);

-- Website actions (singleton)
INSERT INTO website_actions (stream_banner_enabled, registration_enabled) VALUES
    (FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Utilisateurs (rôle User) et tournois de démo
-- (fusion de l'ancien 03-tournaments-and-users.sql)
-- ==========================================

-- Utilisateurs avec rôle User (mot de passe : "password" pour tous)
-- Hash bcrypt pour "password" : $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO "user" (id, username, password, email, is_active, is_banned, has_accepted_terms_and_conditions) VALUES
    (4, 'alice', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alice@example.com', TRUE, FALSE, TRUE),
    (5, 'bob', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'bob@example.com', TRUE, FALSE, TRUE),
    (6, 'charlie', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'charlie@example.com', TRUE, FALSE, TRUE),
    (7, 'diana', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'diana@example.com', TRUE, FALSE, TRUE),
    (8, 'etienne', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'etienne@example.com', TRUE, FALSE, TRUE),
    (9, 'francois', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'francois@example.com', TRUE, FALSE, TRUE),
    (10, 'geraldine', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'geraldine@example.com', TRUE, FALSE, TRUE),
    (11, 'hugo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hugo@example.com', TRUE, FALSE, TRUE),
    (12, 'iris', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'iris@example.com', TRUE, FALSE, TRUE),
    (13, 'julien', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'julien@example.com', TRUE, FALSE, TRUE),
    (14, 'karim', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'karim@example.com', TRUE, FALSE, TRUE),
    (15, 'laura', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'laura@example.com', TRUE, FALSE, TRUE),
    (16, 'marc', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'marc@example.com', TRUE, FALSE, TRUE),
    (17, 'nina', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'nina@example.com', TRUE, FALSE, TRUE),
    (18, 'olivier', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'olivier@example.com', TRUE, FALSE, TRUE),
    (19, 'pauline', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pauline@example.com', TRUE, FALSE, TRUE),
    (20, 'quentin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'quentin@example.com', TRUE, FALSE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- Attribution du rôle User (role_id = 2) à ces utilisateurs
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 2 FROM "user" u WHERE u.username IN (
    'alice', 'bob', 'charlie', 'diana', 'etienne',
    'francois', 'geraldine', 'hugo', 'iris', 'julien', 'karim',
    'laura', 'marc', 'nina', 'olivier', 'pauline', 'quentin'
)
AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = 2);

-- Remettre la séquence user à jour après insertion d'IDs explicites
SELECT setval('user_id_seq', (SELECT COALESCE(MAX(id), 1) FROM "user"));

-- Tournois de démo (event_date = début, event_date_end = fin)
INSERT INTO tournament (id, name, max_number_of_rounds, matches_per_round, status, current_round, until_winner, max_players, location, event_date, event_date_end, is_online) VALUES
    (1, 'Championnat du printemps 2025', 2, 3, 'registration_open', 0, FALSE, 4, 'Paris - Salle des Duelistes', '2026-04-12 14:00:00', '2026-04-12 20:00:00', FALSE),
    (2, 'Ligue en ligne - Semaine 42', 4, 1, 'registration_open', 0, FALSE, 32, NULL, '2026-10-20 19:00:00', '2026-10-20 23:00:00', TRUE),
    (3, 'Open Lyon', 6, 3, 'tournament_in_progress', 2, FALSE, 24, 'Lyon - Game Over Store', '2025-03-01 10:00:00', '2025-03-01 18:00:00', FALSE),
    (4, 'Tournoi amical novembre', 3, 1, 'registration_closed', 0, FALSE, 8, NULL, '2025-11-15 18:00:00', '2025-11-15 22:00:00', TRUE),
    (5, 'Winter Cup 2025', 5, 3, 'tournament_beginning', 0, TRUE, 64, 'Lille - Convention JEUX', '2026-02-10 09:00:00', '2026-02-10 19:00:00', FALSE)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('tournament', 'id'), (SELECT COALESCE(MAX(id), 1) FROM tournament));

-- Inscriptions de démo : quelques utilisateurs inscrits à des tournois
-- Championnat du printemps 2025 (id = 1) : tournoi plein (16 joueurs)
INSERT INTO tournament_player (tournament_id, user_id) VALUES
    (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (2, 4),
    (2, 6),
    (3, 2),
    (3, 4),
    (3, 5),
    (3, 6)
ON CONFLICT (tournament_id, user_id) DO NOTHING;
