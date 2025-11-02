-- Script SQL complet pour le projet Archetype Warfare
-- Ce fichier contient toutes les tables, contraintes et données initiales

-- ==========================================
-- TABLE CREATION
-- ==========================================

-- Table era
CREATE TABLE IF NOT EXISTS era (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

-- Séquence pour archetype
CREATE SEQUENCE IF NOT EXISTS archetype_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

-- Table archetype
CREATE TABLE IF NOT EXISTS archetype (
    id BIGINT DEFAULT nextval('archetype_id_seq') PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    main_info TEXT,
    slider_info TEXT,
    is_highlighted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    slider_img_url TEXT,
    card_img_url TEXT,
    in_tcg_date DATE NOT NULL,
    in_aw_date DATE NOT NULL,
    comment TEXT DEFAULT NULL,
    popularity_poll BIGINT NOT NULL DEFAULT 0,
    era_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_era FOREIGN KEY (era_id) REFERENCES era (id) ON DELETE CASCADE
);

-- Table attribute
CREATE TABLE IF NOT EXISTS attribute (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

-- Table summonmechanic
CREATE TABLE IF NOT EXISTS summonmechanic (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

-- Table type
CREATE TABLE IF NOT EXISTS type (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

-- Table role
CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE  
);

-- Séquence pour user
CREATE SEQUENCE IF NOT EXISTS user_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

-- Table user
CREATE TABLE IF NOT EXISTS "user" (
    id BIGINT DEFAULT nextval('user_id_seq') PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    reset_password_token TEXT null,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN not null default FALSE,
    is_banned BOOLEAN not null default FALSE,
    has_accepted_terms_and_conditions BOOLEAN not null default FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT username_length_check CHECK (length(username) >= 3 AND length(username) <= 30),
    CONSTRAINT email_format_check CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Table user_role (relation many-to-many)
CREATE TABLE IF NOT EXISTS user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE
);

-- Table deck
CREATE TABLE IF NOT EXISTS deck (
    id SERIAL PRIMARY KEY,
    label VARCHAR(200) NOT NULL,
    comment TEXT,
    archetype_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

-- Table card_type
CREATE TABLE IF NOT EXISTS card_type (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    num_order INT NOT NULL UNIQUE
);

-- Table card
CREATE TABLE IF NOT EXISTS card (
    id VARCHAR(8) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    img_url TEXT NOT NULL,
    description TEXT NULL,
    level INT NULL,
    atk INT NULL,
    def INT NULL,
    attribute VARCHAR(30) NULL,
    type VARCHAR(30) NULL,
    card_type VARCHAR(200) NULL
);

-- Table banlist
CREATE TABLE IF NOT EXISTS banlist (
    id SERIAL PRIMARY KEY,
    label VARCHAR(200) NOT NULL UNIQUE,
    release_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table card_status
CREATE TABLE IF NOT EXISTS card_status (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
    limit INT NOT NULL UNIQUE
);

-- Table deck_card (relation many-to-many)
CREATE TABLE IF NOT EXISTS deck_card (
    deck_id BIGINT NOT NULL,
    card_id VARCHAR(8) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_deck FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE
);

-- Table archetype_type (relation many-to-many)
CREATE TABLE IF NOT EXISTS archetype_type (
    archetype_id BIGINT NOT NULL,
    type_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_type FOREIGN KEY (type_id) REFERENCES type (id) ON DELETE CASCADE
);

-- Table archetype_attribute (relation many-to-many)
CREATE TABLE IF NOT EXISTS archetype_attribute (
    archetype_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_attribute FOREIGN KEY (attribute_id) REFERENCES attribute (id) ON DELETE CASCADE
);

-- Table archetype_summonmechanic (relation many-to-many)
CREATE TABLE IF NOT EXISTS archetype_summonmechanic (
    archetype_id BIGINT NOT NULL,
    summonmechanic_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_summonmechanic FOREIGN KEY (summonmechanic_id) REFERENCES summonmechanic (id) ON DELETE CASCADE
);

-- Table banlist_archetype_card
CREATE TABLE IF NOT EXISTS banlist_archetype_card (
    id SERIAL PRIMARY KEY,
    banlist_id BIGINT NOT NULL,
    archetype_id BIGINT NULL,
    card_id VARCHAR(8) NOT NULL,
    card_status_id BIGINT NOT NULL,
    explanation_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_banlist FOREIGN KEY (banlist_id) REFERENCES banlist (id) ON DELETE CASCADE,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_status FOREIGN KEY (card_status_id) REFERENCES card_status (id) ON DELETE CASCADE
);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Fonction pour vérifier les contraintes du username
CREATE OR REPLACE FUNCTION check_username_constraints() 
RETURNS TRIGGER AS $$
BEGIN
    IF LENGTH(NEW.username) < 3 OR LENGTH(NEW.username) > 30 THEN
        RAISE EXCEPTION 'Le nom d''utilisateur doit contenir entre 3 et 30 caractères.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier username
CREATE TRIGGER IF NOT EXISTS check_username_before_insert_or_update
BEFORE INSERT OR UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION check_username_constraints();

-- Fonction pour vérifier que password n'est pas NULL
CREATE OR REPLACE FUNCTION enforce_password_not_null()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password IS NULL AND OLD.password IS NOT NULL THEN
        RAISE EXCEPTION 'Le mot de passe ne peut pas être vide après la première modification';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier password
CREATE TRIGGER IF NOT EXISTS password_update_check
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION enforce_password_not_null();

-- Fonction pour vérifier les exigences de l'archetype
CREATE OR REPLACE FUNCTION check_archetype_requirements()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF (SELECT COUNT(*) FROM archetype_attribute WHERE archetype_id = NEW.id) < 1 THEN
            RAISE EXCEPTION 'L''archetype doit avoir au moins un attribut.';
        END IF;

        IF (SELECT COUNT(*) FROM archetype_type WHERE archetype_id = NEW.id) < 1 THEN
            RAISE EXCEPTION 'L''archetype doit avoir au moins un type.';
        END IF;

        IF (SELECT COUNT(*) FROM archetype_summonmechanic WHERE archetype_id = NEW.id) < 1 THEN
            RAISE EXCEPTION 'L''archetype doit avoir au moins une summonmechanic.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier les exigences de l'archetype
CREATE TRIGGER IF NOT EXISTS archetype_requirements_check
BEFORE UPDATE ON archetype
FOR EACH ROW
EXECUTE FUNCTION check_archetype_requirements();

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at sur user
DROP TRIGGER IF EXISTS update_user_updated_at ON "user";
CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "user" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Insert era
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

-- Insert attribute
INSERT INTO attribute (id, label) VALUES
    (1, 'LIGHT'),
    (2, 'DARK'),
    (3, 'WATER'),
    (4, 'FIRE'),
    (5, 'EARTH'),
    (6, 'WIND'),
    (7, 'DIVINE')
ON CONFLICT (id) DO NOTHING;

-- Insert type
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

-- Insert summonmechanic
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

-- Insert card_status
INSERT INTO card_status (id, label, limit) VALUES
    (1, 'Forbidden', 0),
    (2, 'Limited', 1),
    (3, 'Semi-Limited', 2),
    (4, 'Unlimited', 3)
ON CONFLICT (id) DO NOTHING;

-- Insert card_type
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
    (10, 'Pendulum Normal Monster', 11),
    (11, 'Pendulum Effect Monster', 12),
    (12, 'Pendulum Effect Ritual Monster', 17),
    (13, 'Pendulum Tuner Effect Monster', 14),
    (14, 'Ritual Monster', 15),
    (15, 'Ritual Effect Monster', 16),
    (16, 'Toon Monster', 10),
    (17, 'Fusion Monster', 18),
    (18, 'Synchro Monster', 20),
    (19, 'Synchro Tuner Monster', 21),
    (20, 'Synchro Pendulum Effect Monster', 22),
    (21, 'XYZ Monster', 23),
    (22, 'XYZ Pendulum Effect Monster', 24),
    (23, 'Link Monster', 25),
    (24, 'Pendulum Flip Effect Monster', 13),
    (25, 'Pendulum Effect Fusion Monster', 19),
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

-- Insert roles
INSERT INTO role (id, label) VALUES 
    (1, 'Admin'),
    (2, 'User')
ON CONFLICT (id) DO NOTHING;

-- ==========================================

INSERT INTO archetype (id, name, main_info, slider_info, is_highlighted, is_active, in_tcg_date, in_aw_date, comment, popularity_poll, era_id, created_at, updated_at, slider_img_url, card_img_url) VALUES
(17, 'Six Samourai', 'Un archetype centré sur l''invocation rapide de guerrier', 'Tranchez vos adversaires !', true, true, '2002-01-01', '2025-10-21', NULL, 0, 3, '2025-10-21 16:54:08.447', '2025-10-22 09:15:20.041', 'https://res.cloudinary.com/dqfuwqmql/image/upload/v1761065648/jumbotron_archetypes/kjohjmad5idfm0xrh3av.png', 'https://res.cloudinary.com/dqfuwqmql/image/upload/v1761065649/introduction_archetypes/cbwm7pl2zjw1oc3rrbso.png'),
(19, 'Yosenjuu', 'Yosenjuu', 'Yosenjuu', true, true, '2002-01-01', '2025-10-21', NULL, 0, 5, '2025-10-21 18:31:30.076', '2025-10-21 22:00:18.652', 'https://res.cloudinary.com/dqfuwqmql/image/upload/v1761071489/jumbotron_archetypes/mil8ywsyrkbeq1pvmhlw.png', 'https://res.cloudinary.com/dqfuwqmql/image/upload/v1761071489/introduction_archetypes/yyc3ig6dvutom3gl7uvq.png'),
(20, 'Dinosaure', 'ABC', 'Ecrasez les sentiers de la victoire', true, true, '2002-01-01', '2025-10-21', 'Cet archetype est basé sur les cartes du deck de structure', 0, 5, '2025-10-21 22:08:24.498', '2025-10-21 22:08:28.571', 'https://res.cloudinary.com/dqfuwqmql/image/upload/v1761084503/jumbotron_archetypes/amfrigunrjbc0ph2zx7w.png', 'https://res.cloudinary.com/dqfuwqmql/image/upload/v1761084504/introduction_archetypes/fo5huqlmmtr5nabu4dfr.png')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    main_info = EXCLUDED.main_info,
    slider_info = EXCLUDED.slider_info,
    is_highlighted = EXCLUDED.is_highlighted,
    is_active = EXCLUDED.is_active,
    slider_img_url = EXCLUDED.slider_img_url,
    card_img_url = EXCLUDED.card_img_url;

    -- ==========================================
-- CARDS FOR ARCHETYPES
-- ==========================================

-- Cards for Six Samurai (ID: 17)
INSERT INTO card (id, name, img_url, description, level, atk, def, attribute, type, card_type) VALUES
('80570228', 'Anarchist Monk of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/80570228.jpg', 'If you control a "Six Samurai" monster other than "Anarchist Monk of the Six Samurai", you can Special Summon this card (from your hand). You can only Special Summon "Anarchist Monk of the Six Samurai" once per turn this way. You can only use each of the following effects of "Anarchist Monk of the Six Samurai" once per turn. If this card is sent from the field to the GY: You can add 1 "Six Samurai" Quick-Play Spell from your Deck to your hand. A "Six Samurai" monster that was Synchro Summoned using this card gains this effect. The Levels of all monsters your opponent controls are reduced by 1.', 3, 500, 0, 'DARK', 'Warrior', 'Tuner Monster'),
('27821104', 'Asceticism of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/27821104.jpg', 'Target 1 "Six Samurai" monster you control; Special Summon 1 "Six Samurai" monster from your Deck with the same ATK but a different name, and if you do, destroy it during the End Phase of this turn.', NULL, NULL, NULL, NULL, NULL, 'Quick-Play Spell'),
('74752631', 'Battle Shogun of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/74752631.jpg', '2 Warrior monsters, including a "Six Samurai" monster. If this card is Link Summoned: You can discard 1 card; add 1 card from your Deck to your hand that has an effect that places a Bushido Counter(s). You can only use this effect of "Battle Shogun of the Six Samurai" once per turn. Each time a "Six Samurai" monster(s) is Normal or Special Summoned to a zone(s) this card points to, place 1 Bushido Counter on this card. Gains 100 ATK for each Bushido Counter on your field.', NULL, 1000, NULL, 'EARTH', 'Warrior', 'Link Monster'),
('44430454', 'Chamberlain of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/44430454.jpg', 'The Six Samurai are supported from the shadows by this silent and mysterious warrior. His past is unknown to them, but his countless scars are proof of his experience.', 3, 200, 2000, 'EARTH', 'Warrior', 'Normal Monster'),
('27178262', 'Cunning of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/27178262.jpg', 'Send 1 face-up "Six Samurai" monster you control to the Graveyard, then target 1 "Six Samurai" monster in either player''s Graveyard; Special Summon that target.', NULL, NULL, NULL, NULL, NULL, 'Quick-Play Spell'),
('61737116', 'Elder of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/61737116.jpg', 'If your opponent controls a monster and you control no monsters, you can Special Summon this card (from your hand).', 3, 400, 0, 'EARTH', 'Warrior', 'Effect Monster'),
('27970830', 'Gateway of the Six', 'https://images.ygoprodeck.com/images/cards/27970830.jpg', 'Each time a "Six Samurai" monster(s) is Normal or Special Summoned, place 2 Bushido Counters on this card. You can remove Bushido Counters from your field to activate these effects. 2 Counters: Target 1 "Six Samurai" or "Shien" Effect Monster; that target gains 500 ATK until the end of this turn. 4 Counters: Add 1 "Six Samurai" monster from your Deck or GY to your hand. 6 Counters: Target 1 "Shien" Effect Monster in your GY; Special Summon that target.', NULL, NULL, NULL, NULL, NULL, 'Continuous Spell'),
('83039729', 'Grandmaster of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/83039729.jpg', 'While you control another "Six Samurai" monster with a different name, this card gains 500 ATK and DEF. If this card would be destroyed, you can destroy another "Six Samurai" monster you control instead.', 5, 2100, 800, 'EARTH', 'Warrior', 'Effect Monster'),
('78792195', 'Great Shogun Shien', 'https://images.ygoprodeck.com/images/cards/78792195.jpg', 'If you control a face-up "Six Samurai" monster(s), you can Special Summon this card (from your hand). Your opponent can only activate 1 Spell/Trap Card per turn.', 7, 2500, 2400, 'EARTH', 'Warrior', 'Effect Monster'),
('1498130', 'Hand of the Six Samurai', 'https://images.ygoprodeck.com/images/cards/1498130.jpg', 'If you control another "Six Samurai" monster: You can Tribute 1 "Six Samurai" monster, then target 1 monster on the field; destroy it.', 3, 1600, 1000, 'FIRE', 'Warrior', 'Effect Monster'),
('70634245', 'Legendary Six Samurai - Enishi', 'https://images.ygoprodeck.com/images/cards/70634245.jpg', 'Once per turn, during either player''s turn: You can banish 2 "Six Samurai" monsters from your Graveyard to target 1 face-up monster on the field; banish it until the End Phase.', 4, 1700, 700, 'LIGHT', 'Warrior', 'Effect Monster'),
('42209438', 'Legendary Six Samurai - Kageki', 'https://images.ygoprodeck.com/images/cards/42209438.jpg', 'If you control a face-up "Six Samurai" monster other than "Legendary Six Samurai - Kageki", you can Special Summon this card (from your hand).', 4, 200, 2000, 'EARTH', 'Warrior', 'Effect Monster'),
('34235530', 'Legendary Six Samurai - Kizan', 'https://images.ygoprodeck.com/images/cards/34235530.jpg', 'If you control a face-up "Six Samurai" monster other than "Legendary Six Samurai - Kizan", you can Special Summon this card (from your hand).', 4, 1800, 500, 'EARTH', 'Warrior', 'Effect Monster'),
('15327215', 'Legendary Six Samurai - Mizuho', 'https://images.ygoprodeck.com/images/cards/15327215.jpg', 'If you control a face-up "Six Samurai" monster other than "Legendary Six Samurai - Mizuho", you can Special Summon this card (from your hand). Once per turn: You can target 1 "Six Samurai" monster other than "Legendary Six Samurai - Mizuho"; destroy it, and if you do, banish it.', 3, 1600, 1000, 'FIRE', 'Warrior', 'Effect Monster'),
('75116619', 'Legendary Six Samurai - Shinai', 'https://images.ygoprodeck.com/images/cards/75116619.jpg', 'If you control a face-up "Legendary Six Samurai - Shinai", you can Special Summon this card (from your hand).', 3, 1500, 1500, 'WATER', 'Warrior', 'Effect Monster'),
('2511717', 'Legendary Six Samurai - Shi En', 'https://images.ygoprodeck.com/images/cards/2511717.jpg', '1 Tuner + 1+ non-Tuner "Six Samurai" monsters Once per turn, when your opponent would activate a Spell/Trap Card: You can negate the activation and destroy it. If this card is destroyed by card effect: You can target 1 "Six Samurai" monster in your GY; Special Summon that target.', 5, 2500, 1400, 'WIND', 'Warrior', 'Synchro Monster'),
('49721904', 'Secret Six Samurai - Doji', 'https://images.ygoprodeck.com/images/cards/49721904.jpg', 'If you control a "Six Samurai" monster: You can Special Summon this card from your hand. You can only use this effect of "Secret Six Samurai - Doji" once per turn.', 4, 400, 1800, 'WIND', 'Warrior', 'Effect Monster'),
('74094021', 'Secret Six Samurai - Fuma', 'https://images.ygoprodeck.com/images/cards/74094021.jpg', 'If this card is sent to the GY: You can target 1 "Six Samurai" monster in your GY, except "Secret Six Samurai - Fuma"; Special Summon it. If this card is sent to the GY for the Synchro Summon of a "Six Samurai" monster: You can send 1 "Six Samurai" monster from your Deck to the GY, then target 1 "Shien" Effect Monster in your GY; Special Summon it.', 1, 200, 1800, 'WIND', 'Warrior', 'Tuner Monster'),
('29981921', 'Secret Six Samurai - Genba', 'https://images.ygoprodeck.com/images/cards/29981921.jpg', 'If this card is Normal Summoned: You can target 1 "Six Samurai" card in your GY; add it to your hand, but banish it when it leaves the field. If exactly 1 "Six Samurai" monster you control (and no other cards) would be destroyed by a card effect, you can banish this card from your GY instead.', 3, 600, 1600, 'EARTH', 'Warrior', 'Effect Monster'),
('48505422', 'Secret Six Samurai - Kizaru', 'https://images.ygoprodeck.com/images/cards/48505422.jpg', 'If you control a "Six Samurai" monster: You can Special Summon this card from your hand. If you control exactly 3 "Six Samurai" monsters with different Attributes: You can target 1 card on the field; destroy it.', 4, 1900, 800, 'EARTH', 'Warrior', 'Effect Monster')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    img_url = EXCLUDED.img_url,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    atk = EXCLUDED.atk,
    def = EXCLUDED.def,
    attribute = EXCLUDED.attribute,
    type = EXCLUDED.type,
    card_type = EXCLUDED.card_type;

-- Cards for Yosenjuu (ID: 19)
INSERT INTO card (id, name, img_url, description, level, atk, def, attribute, type, card_type) VALUES
('93368494', 'Mayosenju Daibak', 'https://images.ygoprodeck.com/images/cards/93368494.jpg', 'Cannot be Special Summoned, except by Pendulum Summon. This card''s Pendulum Summon cannot be negated. If this card is Normal or Special Summoned: You can target up to 2 cards on the field; return them to the hand. Once per turn, during the End Phase, if this card was Special Summoned this turn: Return it to the hand.', 10, 3000, 300, 'WIND', 'Beast', 'Pendulum Effect Monster'),
('21364070', 'Mayosenju Hitot', 'https://images.ygoprodeck.com/images/cards/21364070.jpg', 'Cannot be Special Summoned, except by Pendulum Summon. If this card is Normal or Special Summoned: You can target 1 card your opponent controls; return it to the hand. Each time a card(s) on the field is returned to the hand or Main Deck by your card effect, while this card is on the field: All "Yosenju" monsters you currently control gain 500 ATK. Once per turn, during the End Phase, if this card was Special Summoned this turn: Return it to the hand.', 10, 2000, 3000, 'WIND', 'Beast', 'Pendulum Effect Monster'),
('85970321', 'Yosenju Izna', 'https://images.ygoprodeck.com/images/cards/85970321.jpg', 'Once per turn, during the End Phase, if this card was Normal Summoned this turn: Return it to the hand. You can only use each of the following effects of "Yosenju Izna" once per turn. You can discard this card; this turn, your opponent cannot activate cards or effects when a "Yosenju" monster(s) is Normal or Special Summoned. If you control another "Yosenju" monster: You can draw 1 card.', 4, 800, 1200, 'WIND', 'Beast', 'Effect Monster'),
('65247798', 'Yosenju Kama 1', 'https://images.ygoprodeck.com/images/cards/65247798.jpg', 'Once per turn, during the End Phase, if this card was Normal Summoned this turn: Return it to the hand. If this card is Normal Summoned, you can: Immediately after this effect resolves, Normal Summon 1 "Yosenju" monster from your hand, except "Yosenju Kama 1". If you control another "Yosenju" monster: You can target 1 face-up card your opponent controls; return it to the hand.', 4, 1600, 500, 'WIND', 'Beast', 'Effect Monster'),
('92246806', 'Yosenju Kama 2', 'https://images.ygoprodeck.com/images/cards/92246806.jpg', 'If this card is Normal Summoned, you can: Immediately after this effect resolves, Normal Summon 1 "Yosenju" monster from your hand, except "Yosenju Kama 2". If you control another "Yosenju" monster: You can target 1 card in your opponent''s Graveyard; banish it, and if you do, this card gains 500 ATK until the end of this turn. Once per turn, during the End Phase, if this card was Normal Summoned this turn: Return it to the hand.', 4, 1800, 200, 'WIND', 'Beast', 'Effect Monster'),
('28630501', 'Yosenju Kama 3', 'https://images.ygoprodeck.com/images/cards/28630501.jpg', 'If this card is Normal Summoned, you can: Immediately after this effect resolves, Normal Summon 1 "Yosenju" monster from your hand, except "Yosenju Kama 3". If this card is destroyed by battle or card effect and sent to the Graveyard: You can target 1 "Yosenju" card in your Graveyard, except "Yosenju Kama 3"; add it to your hand. Once per turn, during the End Phase, if this card was Normal Summoned this turn: Return it to the hand.', 4, 1700, 100, 'WIND', 'Beast', 'Effect Monster'),
('23740893', 'Yosenju Oyam', 'https://images.ygoprodeck.com/images/cards/23740893.jpg', 'When this card is Normal Summoned: You can Special Summon 1 Level 5 or higher "Yosenju" monster from your hand, but it has its effects negated (if any). Once per turn: You can banish 1 "Yosenju" card from your Graveyard, then target 1 face-up card on the field; destroy it.', 6, 1900, 0, 'WIND', 'Beast', 'Effect Monster'),
('49249907', 'Yosenju Sabu', 'https://images.ygoprodeck.com/images/cards/49249907.jpg', 'If you control no other monsters: You can Special Summon this card from your hand. A "Yosenju" monster that was Special Summoned this way cannot be used as Synchro Material. If this card is Special Summoned: You can add 1 "Yosenju" Pendulum Monster from your Deck to your hand. You can only use each effect of "Yosenju Sabu" once per turn.', 4, 1800, 400, 'WIND', 'Beast', 'Effect Monster'),
('61884774', 'Yosenjus Shinchu R', 'https://images.ygoprodeck.com/images/cards/61884774.jpg', 'While you have another "Yosenju" card in your Pendulum Zone: You can target 1 "Yosenju" monster you control; it gains 500 ATK for each "Yosenju" card in your Pendulum Zones (even if this card leaves the field). Once per turn, during the End Phase, if this card was Normal Summoned this turn: Return it to the hand.', 4, 1000, 0, 'WIND', 'Beast', 'Effect Monster'),
('69838592', 'Yosenjus Shinchu L', 'https://images.ygoprodeck.com/images/cards/69838592.jpg', 'While you have another "Yosenju" card in your Pendulum Zone: You can Special Summon this card from your hand. You can only use this effect of "Yosenjus Shinchu L" once per turn. Once per turn, during the End Phase, if this card was Normal or Special Summoned this turn: Return it to the hand.', 4, 1000, 0, 'WIND', 'Beast', 'Effect Monster'),
('58981727', 'Yosenju Tsujik', 'https://images.ygoprodeck.com/images/cards/58981727.jpg', 'Once per turn, during the End Phase, if this card was Normal Summoned this turn: Return it to the hand. If this card is discarded: You can add 1 "Yosenju" card from your Deck to your hand, except "Yosenju Tsujik". You can only use this effect of "Yosenju Tsujik" once per turn. If this card is sent to the Graveyard: You can target 1 card your opponent controls; return it to the hand.', 4, 1000, 1000, 'WIND', 'Beast', 'Effect Monster'),
('65025250', 'Yosen Whirlwind', 'https://images.ygoprodeck.com/images/cards/65025250.jpg', 'Activate this card by paying 800 LP. Once per turn, if a face-up "Yosenju" monster you control returns to the hand (except during the Damage Step): You can target 1 card your opponent controls; return it to the hand. During your End Phase, unless this effect was activated this turn (and was not negated), destroy this card.', NULL, NULL, NULL, NULL, NULL, 'Continuous Spell'),
('91420254', 'Yosen Training Grounds', 'https://images.ygoprodeck.com/images/cards/91420254.jpg', 'Each time a "Yosenju" monster(s) is Normal or Special Summoned, place 1 Yosen Counter on this card. You can remove any number of Yosen Counters from this card; apply this effect, depending on the number of Yosen Counters removed. You can only use this effect of "Yosen Training Grounds" once per turn. 1 Counter: All "Yosenju" monsters you currently control gain 300 ATK until the end of this turn. 3 Counters: Add 1 "Yosenju" card from your Deck or Graveyard to your hand.', NULL, NULL, NULL, NULL, NULL, 'Continuous Spell'),
('54903668', 'Dizzying Winds of Yosen Village', 'https://images.ygoprodeck.com/images/cards/54903668.jpg', 'Activate this card only if you control a Level 6 or higher "Yosenju" monster. While you have a "Yosenju" card in your Pendulum Zone, if a monster would be returned from the field to the hand by a card effect, shuffle it into the Deck instead, unless it is a "Yosenju" monster.', NULL, NULL, NULL, NULL, NULL, 'Continuous Trap'),
('10612222', 'Yosenju Shinchu', 'https://images.ygoprodeck.com/images/cards/10612222.jpg', 'If this card is destroyed by battle or card effect: You can Special Summon 1 "Yosenju" monster from your Deck, except "Yosenju Shinchu". Once per turn, during the End Phase, if this card was Normal Summoned this turn: Return it to the hand.', 4, 600, 1800, 'WIND', 'Beast', 'Effect Monster'),
('25244515', 'Yosenjus Thundering Bow', 'https://images.ygoprodeck.com/images/cards/25244515.jpg', 'Activate only while you control a "Yosenju" monster. While you have at least 1 "Yosenju" card in your Pendulum Zone, each time a card(s) is shuffled from the field into its owner''s Deck by a card effect: Target 1 card your opponent controls; destroy it.', NULL, NULL, NULL, NULL, NULL, 'Continuous Trap'),
('54880296', 'Yosenjus Hornet', 'https://images.ygoprodeck.com/images/cards/54880296.jpg', 'If this card is destroyed by battle or card effect and sent to the Graveyard: You can add 1 "Yosenju" Pendulum Monster from your Deck to your hand. If a "Yosenju" monster(s) you control would be destroyed by battle, you can destroy this card instead.', 4, 1800, 300, 'WIND', 'Beast', 'Effect Monster'),
('39853199', 'Yosen Judgment', 'https://images.ygoprodeck.com/images/cards/39853199.jpg', 'Target 1 "Yosenju" monster you control; return it to the hand, and if you do, Special Summon 1 "Yosenju" Pendulum Monster from your Deck with a different name from that monster.', NULL, NULL, NULL, NULL, NULL, 'Quick-Play Spell'),
('62681049', 'Yosen Secret Move', 'https://images.ygoprodeck.com/images/cards/62681049.jpg', 'When your opponent''s monster declares a direct attack: Banish 1 "Yosenju" monster from your Graveyard; negate the attack, then if you control no monsters, you can Special Summon 1 "Yosenju" monster from your Deck.', NULL, NULL, NULL, NULL, NULL, 'Normal Trap')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    img_url = EXCLUDED.img_url,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    atk = EXCLUDED.atk,
    def = EXCLUDED.def,
    attribute = EXCLUDED.attribute,
    type = EXCLUDED.type,
    card_type = EXCLUDED.card_type;
-- Cards for Dinosaure (ID: 20)
INSERT INTO card (id, name, img_url, description, level, atk, def, attribute, type, card_type) VALUES
('44335251', 'Animadorned Archosaur', 'https://images.ygoprodeck.com/images/cards/44335251.jpg', 'If this card is Normal or Special Summoned: You can destroy 1 Dinosaur monster in your hand or face-up field, except "Animadorned Archosaur", then add 1 Reptile, Sea Serpent, or Winged Beast monster with the same original Level as that destroyed monster, OR 1 "Evolution Pill" Spell, from your Deck to your hand. You can only use this effect of "Animadorned Archosaur" once per turn.', 1, 0, 0, 'LIGHT', 'Dinosaur', 'Effect Monster'),
('36042004', 'Babycerasaurus', 'https://images.ygoprodeck.com/images/cards/36042004.jpg', 'If this card is destroyed by a card effect and sent to the Graveyard: Special Summon 1 Level 4 or lower Dinosaur-Type monster from your Deck.', 2, 500, 500, 'EARTH', 'Dinosaur', 'Effect Monster'),
('82946847', 'Jurrac Guaiba', 'https://images.ygoprodeck.com/images/cards/82946847.jpg', 'If this card destroys an opponent''s monster by battle: You can Special Summon 1 "Jurrac" monster with 1700 or less ATK from your Deck in face-up Defense Position.', 4, 1700, 400, 'FIRE', 'Dinosaur', 'Effect Monster'),
('18940556', 'Jurrac Stauriko', 'https://images.ygoprodeck.com/images/cards/18940556.jpg', 'When this card is destroyed by battle and sent to the Graveyard: You can activate this effect: Special Summon 1 Level 4 or lower "Jurrac" monster from your Deck in face-up Defense Position.', 2, 500, 400, 'FIRE', 'Dinosaur', 'Effect Monster'),
('58272005', 'Jurrac Titano', 'https://images.ygoprodeck.com/images/cards/58272005.jpg', 'Cannot be Normal Summoned/Set. Must be Special Summoned by its own effect and cannot be Special Summoned in other ways. When a "Jurrac" monster you control, except "Jurrac Titano", is destroyed by battle with an opponent''s monster and sent to the Graveyard: You can Special Summon this card from your hand. This card is not affected by other cards'' effects. At the end of your opponent''s Battle Phase, if this card attacked or was attacked: Return this card to the hand.', 11, 3000, 2800, 'FIRE', 'Dinosaur', 'Effect Monster'),
('44612603', 'Jurrac Velphito', 'https://images.ygoprodeck.com/images/cards/44612603.jpg', 'If this card destroys an opponent''s monster by battle: You can Special Summon 1 "Jurrac" monster from your Deck except "Jurrac Velphito".', 4, 1700, 300, 'FIRE', 'Dinosaur', 'Effect Monster'),
('98022050', 'Jurrac Gallim', 'https://images.ygoprodeck.com/images/cards/98022050.jpg', 'When this card is destroyed by battle and sent to the Graveyard: Special Summon 1 "Jurrac" Tuner monster from your Deck in face-up Defense Position.', 1, 0, 0, 'FIRE', 'Dinosaur', 'Effect Monster'),
('58272008', 'Ultimate Tyranno', 'https://images.ygoprodeck.com/images/cards/58272008.jpg', 'This card can attack all monsters your opponent controls once each. If this card attacks a Defense Position monster, inflict piercing battle damage to your opponent.', 10, 3000, 2000, 'LIGHT', 'Dinosaur', 'Effect Monster'),
('27553701', 'Absolute King - Megaplunder', 'https://images.ygoprodeck.com/images/cards/27553701.jpg', 'The king of dinosaurs that rules over the Earth. Its mighty roar makes its foes tremble in fear!', 6, 2000, 1500, 'EARTH', 'Dinosaur', 'Normal Monster'),
('12580477', 'Fossil Dig', 'https://images.ygoprodeck.com/images/cards/12580477.jpg', 'Add 1 Level 6 or lower Dinosaur-Type monster from your Deck to your hand.', NULL, NULL, NULL, NULL, NULL, 'Normal Spell'),
('15693423', 'Miscellaneousaurus', 'https://images.ygoprodeck.com/images/cards/15693423.jpg', 'Banish 1 Dinosaur-Type monster from your Graveyard; Special Summon 1 Level 4 or lower Dinosaur-Type monster from your Deck.', NULL, NULL, NULL, NULL, NULL, 'Normal Spell'),
('12580478', 'Survival of the Fittest', 'https://images.ygoprodeck.com/images/cards/12580478.jpg', 'Destroy this card during your 3rd End Phase after activation. While this card is face-up on the field, all Dinosaur-Type monsters you control gain 300 ATK.', NULL, NULL, NULL, NULL, NULL, 'Continuous Spell'),
('36042005', 'Jurrac Impact', 'https://images.ygoprodeck.com/images/cards/36042005.jpg', 'When a Dinosaur-Type monster you control is destroyed by battle and sent to the Graveyard: Destroy the monster that destroyed it.', NULL, NULL, NULL, NULL, NULL, 'Normal Trap'),
('82946848', 'Jurrac Fury', 'https://images.ygoprodeck.com/images/cards/82946848.jpg', 'Target face-up "Jurrac" monsters you control; they gain ATK equal to their Level x 200 until the End Phase.', NULL, NULL, NULL, NULL, NULL, 'Normal Trap'),
('44335252', 'Jurrac Meteor', 'https://images.ygoprodeck.com/images/cards/44335252.jpg', 'Target 1 Dinosaur-Type Synchro Monster you control; Special Summon 1 non-Synchro "Jurrac" monster from your Graveyard, but destroy it during the End Phase of this turn.', NULL, NULL, NULL, NULL, NULL, 'Quick-Play Spell'),
('36042006', 'Jurrac Aeolo', 'https://images.ygoprodeck.com/images/cards/36042006.jpg', 'If you control a "Jurrac" monster: You can Special Summon this card (from your hand).', 1, 200, 400, 'FIRE', 'Dinosaur', 'Tuner Monster'),
('82946849', 'Jurrac Velo', 'https://images.ygoprodeck.com/images/cards/82946849.jpg', 'If this card is destroyed by a card effect: You can Special Summon 1 Level 4 or lower "Jurrac" monster from your GY, except "Jurrac Velo".', 3, 1700, 400, 'FIRE', 'Dinosaur', 'Effect Monster'),
('18940557', 'Jurrac Protector', 'https://images.ygoprodeck.com/images/cards/18940557.jpg', 'While you control a face-up "Jurrac" monster, this card cannot be destroyed by battle or by card effects.', 4, 1800, 600, 'FIRE', 'Dinosaur', 'Effect Monster'),
('58272006', 'Jurrac Ptera', 'https://images.ygoprodeck.com/images/cards/58272006.jpg', 'When this card is destroyed by battle and sent to the Graveyard: All face-up monsters your opponent controls lose 800 ATK.', 3, 800, 1500, 'FIRE', 'Dinosaur', 'Effect Monster'),
('44612604', 'Jurrac Dino', 'https://images.ygoprodeck.com/images/cards/44612604.jpg', 'If this card destroys an opponent''s monster by battle: You can Special Summon 1 "Jurrac" monster from your hand or Graveyard.', 4, 1700, 800, 'FIRE', 'Dinosaur', 'Effect Monster')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    img_url = EXCLUDED.img_url,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    atk = EXCLUDED.atk,
    def = EXCLUDED.def,
    attribute = EXCLUDED.attribute,
    type = EXCLUDED.type,
    card_type = EXCLUDED.card_type;

-- ==========================================
-- BANLIST ARCHETYPE CARD DATA
-- ==========================================

-- Insert banlist
INSERT INTO banlist (id, label, release_date, is_active, description, created_at, updated_at) VALUES
(1, 'Ocotbre 2025', '2025-10-01 00:00:00', true, 'DEF', '2025-10-08 22:09:16.846699', '2025-10-10 18:26:32.654')
ON CONFLICT (id) DO NOTHING;

-- Insert banlist_archetype_card for Six Samurai (ID: 17)
INSERT INTO banlist_archetype_card (id, banlist_id, archetype_id, card_id, card_status_id, explanation_text, created_at, updated_at) VALUES
(221, 1, 17, '80570228', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(222, 1, 17, '27821104', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(223, 1, 17, '74752631', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(224, 1, 17, '44430454', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(225, 1, 17, '27178262', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(226, 1, 17, '61737116', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(227, 1, 17, '27970830', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(228, 1, 17, '83039729', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(229, 1, 17, '78792195', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(230, 1, 17, '1498130', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(231, 1, 17, '70634245', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(232, 1, 17, '42209438', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(233, 1, 17, '34235530', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(234, 1, 17, '15327215', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(235, 1, 17, '75116619', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(236, 1, 17, '2511717', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(237, 1, 17, '49721904', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(238, 1, 17, '74094021', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(239, 1, 17, '29981921', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(240, 1, 17, '48505422', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(241, 1, 17, '46874015', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(242, 1, 17, '70180284', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(243, 1, 17, '71207871', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(244, 1, 17, '7291576', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(245, 1, 17, '44686185', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(246, 1, 17, '6579928', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(247, 1, 17, '33964637', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(248, 1, 17, '79968632', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(249, 1, 17, '1828513', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(250, 1, 17, '72345736', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(251, 1, 17, '54913680', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(252, 1, 17, '28273805', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(253, 1, 17, '90939874', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(254, 1, 17, '23212990', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(255, 1, 17, '81426505', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(256, 1, 17, '75525309', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(257, 1, 17, '65685470', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(258, 1, 17, '16968936', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(259, 1, 17, '53819808', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(260, 1, 17, '27782503', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(261, 1, 17, '90397998', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(262, 1, 17, '31904181', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(263, 1, 17, '64398890', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(264, 1, 17, '69025477', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(265, 1, 17, '95519486', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479'),
(266, 1, 17, '6357341', 4, 'Carte limitée dans cette banlist', '2025-10-21 16:54:08.479', '2025-10-21 16:54:08.479')
ON CONFLICT (id) DO UPDATE SET
    banlist_id = EXCLUDED.banlist_id,
    archetype_id = EXCLUDED.archetype_id,
    card_id = EXCLUDED.card_id,
    card_status_id = EXCLUDED.card_status_id,
    explanation_text = EXCLUDED.explanation_text;

-- Insert banlist_archetype_card for Yosenjuu (ID: 19)
INSERT INTO banlist_archetype_card (id, banlist_id, archetype_id, card_id, card_status_id, explanation_text, created_at, updated_at) VALUES
(390, 1, 19, '93368494', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(391, 1, 19, '21364070', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(392, 1, 19, '85970321', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(393, 1, 19, '65247798', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(394, 1, 19, '92246806', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(395, 1, 19, '28630501', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(396, 1, 19, '23740893', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(397, 1, 19, '49249907', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(398, 1, 19, '39853199', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(399, 1, 19, '61884774', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(400, 1, 19, '69838592', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(401, 1, 19, '58981727', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(402, 1, 19, '65025250', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(403, 1, 19, '91420254', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(404, 1, 19, '54903668', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(405, 1, 19, '10612222', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(406, 1, 19, '25244515', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664'),
(407, 1, 19, '54880296', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:00:18.664', '2025-10-21 22:00:18.664')
ON CONFLICT (id) DO UPDATE SET
    banlist_id = EXCLUDED.banlist_id,
    archetype_id = EXCLUDED.archetype_id,
    card_id = EXCLUDED.card_id,
    card_status_id = EXCLUDED.card_status_id,
    explanation_text = EXCLUDED.explanation_text;

-- Insert banlist_archetype_card for Dinosaure (ID: 20)
INSERT INTO banlist_archetype_card (id, banlist_id, archetype_id, card_id, card_status_id, explanation_text, created_at, updated_at) VALUES
(408, 1, 20, '44335251', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:08:24.514', '2025-10-21 22:08:24.514'),
(409, 1, 20, '36042004', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:08:24.514', '2025-10-21 22:08:24.514'),
(410, 1, 20, '82946847', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:08:24.514', '2025-10-21 22:08:24.514'),
(411, 1, 20, '18940556', 2, 'Carte limitée dans cette banlist', '2025-10-21 22:08:24.514', '2025-10-21 22:08:24.514'),
(412, 1, 20, '58272005', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:08:24.514', '2025-10-21 22:08:24.514'),
(413, 1, 20, '44612603', 4, 'Carte limitée dans cette banlist', '2025-10-21 22:08:24.515', '2025-10-21 22:08:24.515')
ON CONFLICT (id) DO UPDATE SET
    banlist_id = EXCLUDED.banlist_id,
    archetype_id = EXCLUDED.archetype_id,
    card_id = EXCLUDED.card_id,
    card_status_id = EXCLUDED.card_status_id,
    explanation_text = EXCLUDED.explanation_text;