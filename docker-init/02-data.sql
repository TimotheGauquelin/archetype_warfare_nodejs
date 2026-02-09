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
    (8, 'CHRONICLES');

-- Attribute
INSERT INTO attribute (id, label) VALUES
    (1, 'LIGHT'),
    (2, 'DARK'),
    (3, 'WATER'),
    (4, 'FIRE'),
    (5, 'EARTH'),
    (6, 'WIND'),
    (7, 'DIVINE');

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
    (22, 'Divine-Beast');

-- Summon mechanic
INSERT INTO summonmechanic (id, label) VALUES
    (1, 'Special Summon'),
    (2, 'Tribute Summon'),
    (3, 'Fusion Summon'),
    (4, 'Ritual Summon'),
    (5, 'Synchro Summon'),
    (6, 'Xyz Summon'),
    (7, 'Pendulum Summon'),
    (8, 'Link Summon');

-- Card status
INSERT INTO card_status (id, label, "limit") VALUES
    (1, 'Forbidden', 0),
    (2, 'Limited', 1),
    (3, 'Semi-Limited', 2),
    (4, 'Unlimited', 3);

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
    (34, 'Counter Trap', 34);

-- Archetype (dépend de era)
INSERT INTO archetype (id, name, main_info, slider_info, is_highlighted, is_active, in_tcg_date, in_aw_date, popularity_poll, era_id) VALUES
    (1, 'Blue Eyes', 'A strong archetype focused on dragons.', 'Slider for Dragon Clan', TRUE, TRUE, '2021-05-01', '2021-06-01', 1000, 1),
    (2, 'Dark Magicien', 'Spellcaster-focused archetype.', 'Slider for Magician Circle', FALSE, TRUE, '2020-09-15', '2020-10-01', 850, 1);

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
    (2, 'User');

-- Utilisateurs de test
INSERT INTO "user" (id, username, password, email, is_active, is_banned, has_accepted_terms_and_conditions) VALUES
    (1, 'admin', '$2b$10$example_hash', 'admin@example.com', TRUE, FALSE, TRUE),
    (2, 'testuser', '$2b$10$example_hash', 'test@example.com', TRUE, FALSE, TRUE),
    (3, 'inactive_user', '$2b$10$example_hash', 'inactive@example.com', FALSE, FALSE, FALSE);

-- Liaisons user / role
INSERT INTO user_role (user_id, role_id) VALUES
    (1, 1),
    (2, 2),
    (3, 2);

-- Website actions (singleton)
INSERT INTO website_actions (stream_banner_enabled, registration_enabled) VALUES
    (FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;
