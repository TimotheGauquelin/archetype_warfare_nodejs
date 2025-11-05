-- Tables creation
CREATE TABLE IF NOT EXISTS era (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

CREATE SEQUENCE archetype_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

CREATE TABLE IF NOT EXISTS archetype (
    id BIGINT DEFAULT nextval('archetype_id_seq') PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    main_info TEXT,
    slider_info TEXT,
    is_highlighted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    in_tcg_date DATE NOT NULL,
    in_aw_date DATE NOT NULL,
    comment TEXT DEFAULT NULL,
    popularity_poll BIGINT NOT NULL DEFAULT 0,
    era_id BIGINT NOT NULL,
    CONSTRAINT fk_era FOREIGN KEY (era_id) REFERENCES era (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attribute (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS summonmechanic (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS type (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE  
);

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

CREATE TABLE IF NOT EXISTS "user" (
    id BIGINT DEFAULT nextval('archetype_id_seq') PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    reset_password_token TEXT null,
    email VARCHAR(255) NOT NULL unique,
    is_active BOOLEAN not null default FALSE,
    is_banned BOOLEAN not null default FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT username_length_check CHECK (length(username) >= 3 AND length(username) <= 30),
    CONSTRAINT email_format_check CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

CREATE TABLE IF NOT EXISTS user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deck (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    archetype_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_type (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    num_order INT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS card (
    id CHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    img_url TEXT NOT NULL,
    level INT NULL,
    atk INT NULL,
    def INT NULL,
    description TEXT NULL,
    attribute VARCHAR(30) NULL,
    card_type VARCHAR(200) NULL
);

CREATE TABLE IF NOT EXISTS banlist (
    id SERIAL PRIMARY KEY,
    label VARCHAR(200) NOT NULL UNIQUE,
    release_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE IF NOT EXISTS card_status (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
    limit INT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS deck_card (
    deck_id BIGINT NOT NULL,
    card_id VARCHAR(8) NOT NULL,
    id SERIAL PRIMARY KEY,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deck FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archetype_type (
    archetype_id BIGINT NOT NULL,
    type_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_type FOREIGN KEY (type_id) REFERENCES type (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archetype_attribute (
    archetype_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_attribute FOREIGN KEY (attribute_id) REFERENCES attribute (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archetype_summonmechanic (
    archetype_id BIGINT NOT NULL,
    summonmechanic_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_summonmechanic FOREIGN KEY (summonmechanic_id) REFERENCES summonmechanic (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS banlist_archetype_card (
    banlist_id BIGINT NOT NULL,
    archetype_id BIGINT NOT NULL,
    card_id VARCHAR(8) NOT NULL,
    card_status_id BIGINT NOT NULL,
    explanation_text TEXT NULL,
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_banlist FOREIGN KEY (banlist_id) REFERENCES banlist (id) ON DELETE CASCADE,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_status FOREIGN KEY (card_status_id) REFERENCES card_status (id) ON DELETE CASCADE
);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION check_username_constraints() 
RETURNS TRIGGER AS $$
BEGIN
    IF LENGTH(NEW.username) < 3 OR LENGTH(NEW.username) > 30 THEN
        RAISE EXCEPTION 'Le nom dutilisateur doit contenir entre 3 et 30 caractères.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_username_before_insert_or_update
BEFORE INSERT OR UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION check_username_constraints();

CREATE OR REPLACE FUNCTION enforce_password_not_null()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password IS NULL AND OLD.password IS NOT NULL THEN
        RAISE EXCEPTION 'Le mot de passe ne peut pas être vide après la première modification';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER password_update_check
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION enforce_password_not_null();

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

CREATE TRIGGER archetype_requirements_check
BEFORE UPDATE ON archetype
FOR EACH ROW
EXECUTE FUNCTION check_archetype_requirements();

-- Initial Data
INSERT INTO era (id, label) VALUES 
    (1, 'DM'),
    (2, 'GX'),
    (3, '5DS'),
    (4, 'ZEXAL'),
    (5, 'ARC-V'),
    (6, 'VRAINS'),
    (7, 'MODERN'),
    (8, 'CHRONICLES');

INSERT INTO archetype (id, name, main_info, slider_info, is_highlighted, is_active, in_tcg_date, in_aw_date, popularity_poll, era_id) VALUES
    (1, 'Blue Eyes', 'A strong archetype focused on dragons.', 'Slider for Dragon Clan', TRUE, TRUE, '2021-05-01', '2021-06-01', 1000, 1),
    (2, 'Dark Magicien', 'Spellcaster-focused archetype.', 'Slider for Magician Circle', FALSE, TRUE, '2020-09-15', '2020-10-01', 850, 1);

INSERT INTO attribute (id, label) VALUES
    (1, 'LIGHT'),
    (2, 'DARK'),
    (3, 'WATER'),
    (4, 'FIRE'),
    (5, 'EARTH'),
    (6, 'WIND'),
    (7, 'DIVINE');

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

INSERT INTO summonmechanic (id, label) VALUES
    (1, 'Special Summon'),
    (2, 'Tribute Summon'),
    (3, 'Fusion Summon'),
    (4, 'Ritual Summon'),
    (5, 'Synchro Summon'),
    (6, 'Xyz Summon'),
    (7, 'Pendulum Summon'),
    (8, 'Link Summon');

INSERT INTO card_status (id, label, limit) VALUES
(1, 'Banned', 0),
(2, 'Limited', 1),
(3, 'Semi-Limited', 2),
(4, 'Unlimited', 3);

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

INSERT INTO archetype_attribute (archetype_id, attribute_id) VALUES
    (1, 1), -- Blue Eyes - LIGHT
    (2, 2); -- Dark Magician - DARK

INSERT INTO archetype_type (archetype_id, type_id) VALUES
    (1, 1), -- Blue Eyes - Dragon
    (2, 2); -- Dark Magician - Spellcaster

INSERT INTO archetype_summonmechanic (archetype_id, summonmechanic_id) VALUES
    (1, 2), -- Blue Eyes - Tribute Summon
    (2, 2); -- Dark Magician - Tribute Summon