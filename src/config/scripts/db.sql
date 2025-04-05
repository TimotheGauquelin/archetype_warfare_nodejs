-- ++ AVOIR UN USERNAME VALIDE LORS DE LA CREATION ET MODIFICATION +++++++++++++++

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

-- +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

-- ++ AVOIR UN MOT DE PASSE A NULL A LA CREATION D'UN USER +++++++++++++++

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

-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

-- ++AVOIR MINIMUM 1 ATTRIBUT, TYPE, SUMMON_MECHANIC PAR ARCHETYPE ++++++

CREATE OR REPLACE FUNCTION check_archetype_requirements()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM archetype_attribute WHERE archetype_id = NEW.id) < 1 THEN
        RAISE EXCEPTION 'L''archetype doit avoir au moins un attribut.';
    END IF;

    IF (SELECT COUNT(*) FROM archetype_type WHERE archetype_id = NEW.id) < 1 THEN
        RAISE EXCEPTION 'L''archetype doit avoir au moins un type.';
    END IF;

    IF (SELECT COUNT(*) FROM archetype_summonmechanic WHERE archetype_id = NEW.id) < 1 THEN
        RAISE EXCEPTION 'L''archetype doit avoir au moins une summonmechanic.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER archetype_requirements_check
BEFORE INSERT OR UPDATE ON archetype
FOR EACH ROW
EXECUTE FUNCTION check_archetype_requirements();

-- +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

-- CREATE OR REPLACE FUNCTION generate_unique_deck_id()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     new_id VARCHAR(10);
-- BEGIN
--     LOOP
--         new_id := lpad(floor(random() * 10000000000)::text, 10, '0');
        
--         IF NOT EXISTS (SELECT 1 FROM deck WHERE id = new_id) THEN
--             EXIT;
--         END IF;
--     END LOOP;

--     NEW.id := new_id;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER set_deck_id
-- BEFORE INSERT ON deck
-- FOR EACH ROW
-- WHEN (NEW.id IS NULL)
-- EXECUTE FUNCTION generate_unique_deck_id();

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
    CONSTRAINT username_length_check CHECK (length(username) >= 3 AND length(username) <= 30)
    CONSTRAINT email_format_check CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ));

CREATE TABLE IF NOT EXISTS user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deck (
    id SERIAL PRIMARY KEY,
    label VARCHAR(200) NOT NULL,
    comment TEXT,
    archetype_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cardtype (
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
    attribute VARCHAR(30) NULL,
    type VARCHAR(30) NULL,
    card_type VARCHAR(200) NULL
);

CREATE TABLE IF NOT EXISTS banlist (
    id SERIAL PRIMARY KEY,
    label VARCHAR(200) NOT NULL UNIQUE,
    release_date TIMESTAMP NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS card_status (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS deck_card (
    deck_id BIGINT NOT NULL,
    card_id CHAR(8) NOT NULL,
    PRIMARY KEY (deck_id, card_id),
    CONSTRAINT fk_deck FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS archetype_type (
    archetype_id BIGINT NOT NULL,
    type_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype_type_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_archetype_type_type FOREIGN KEY (type_id) REFERENCES type (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archetype_attribute (
    archetype_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype_attribute_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_archetype_attribute_attribute FOREIGN KEY (attribute_id) REFERENCES attribute (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archetype_summonmechanic (
    archetype_id BIGINT NOT NULL,
    summonmechanic_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype_summonmechanic_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_archetype_summonmechanic_summonmechanic FOREIGN KEY (summonmechanic_id) REFERENCES summonmechanic (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS banlist_archetype_card (
    explanation_text TEXT NOT NULL,
    archetype_id BIGINT NULL,
    card_id CHAR(10) NOT NULL,
    card_status_id BIGINT NOT NULL,
    banlist_id BIGINT NOT NULL,
    CONSTRAINT fk_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_status FOREIGN KEY (card_status_id) REFERENCES card_status (id) ON DELETE CASCADE,
    CONSTRAINT fk_banlist FOREIGN KEY (banlist_id) REFERENCES banlist (id) ON DELETE cascade,
    CONSTRAINT fk_archetype_card_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE
);

INSERT INTO era (id, label) VALUES 
(1,'DM'), 
(2,'GX'),
(3,'5Ds'),
(4,'Zexal'),
(5,'Arc V'),
(6,'Vrain'),
(7,'Modern'),
(8,'Chronicles');

INSERT INTO archetype (id, name, main_info, slider_info, is_highlighted, is_active, in_tcg_date, in_aw_date, popularity_poll, era_id) VALUES 
(1, 'Blue Eyes', 'A strong archetype focused on dragons.', 'Slider for Dragon Clan', TRUE, TRUE, '2021-05-01', '2021-06-01', 1000, 1), 
(2, 'Dark Magicien', 'Spellcaster-focused archetype.', 'Slider for Magician Circle', FALSE, TRUE, '2020-09-15', '2020-10-01', 850, 1);

INSERT INTO attribute (id, label) VALUES 
(1, 'Fire'), 
(2, 'Water'),
(3, 'Earth'),
(4, 'Wind'),
(5, 'Dark'),
(6, 'Light');

INSERT INTO summonmechanic (id, label) VALUES 
(1, 'Tribute'), 
(2, 'Special'), 
(3, 'Ritual'), 
(4, 'Fusion'), 
(5, 'Synchro'),
(6, 'XYZ'),
(7, 'Pendulum'),
(8, 'Link');

INSERT INTO type (id, label) VALUES 
(1, 'Aqua'),
(2, 'Beast'),
(3, 'Beast-Warrior'),
(4, 'Creator-God'),
(5, 'Cyberse'),
(6, 'Dinosaur'),
(7, 'Divine-Beast'),
(8, 'Dragon'),
(9, 'Fairy'),
(10, 'Fiend'),
(11, 'Fish'),
(12, 'Insect'),
(13, 'Machine'),
(14, 'Plant'),
(15, 'Psychic'),
(16, 'Pyro'),
(17, 'Reptile'),
(18, 'Rock'),
(19, 'Sea Serpent'),
(20, 'Spellcaster'),
(21, 'Thunder'),
(22, 'Warrior'),
(23, 'Winged Beast'),
(24, 'Wyrm'),
(25, 'Zombie');

INSERT INTO role (id, label) VALUES 
(1, 'Admin'), 
(2, 'User');

INSERT INTO "user" (id, username, password, email, is_active, is_banned) VALUES 
(1, 'admin_user', 'hashedpassword1', 'admin@example.com', true, false), 
(2, 'regular_user', 'hashedpassword2', 'user@example.com', true, false);

INSERT INTO user_role (user_id, role_id) VALUES 
(1, 1), 
(2, 2);

INSERT INTO deck (id, label, comment, archetype_id, user_id) VALUES 
(1, 'Dragon Deck', 'Focused on summoning strong dragons.', 1, 1), 
(2, 'Spellcaster Deck', 'Relies on powerful spellcasters.', 2, 2);

INSERT INTO cardtype (id, label, num_order) VALUES 
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

INSERT INTO card (id, name, img_url) VALUES 
('89631146', 'Blue-Eyes White Dragon', 'https://images.ygoprodeck.com/images/cards/89631145.jpg",
'), 
('20654247', 'Blue-Eyes Chaos Dragon', 'https://images.ygoprodeck.com/images/cards/20654247.jpg",
'), 
('46986421', 'Dark Magician', 'https://images.ygoprodeck.com/images/cards/46986421.jpg'),
('75380687', 'Amulet Dragon', 'https://images.ygoprodeck.com/images/cards/75380687.jpg');

INSERT INTO banlist (id, label, release_date, description) VALUES 
(1, 'April 2025 Banlist', '2025-04-01', 'First banlist of 2025.');

INSERT INTO card_status (id, label) VALUES 
(1, 'Banned'), 
(2, 'Limited'),
(3, 'Semi-Limited');
(4, 'Unlimited');

INSERT INTO banlist_archetype_card (explanation_text, archetype_id, card_id, card_status_id, banlist_id) VALUES 
('Overpowered in tournaments.', 1, '20654247', 1, 1), 
('Can cause unfair advantages.', 1, '46986421', 2, 1);

INSERT INTO deck_card (deck_id, card_id) VALUES 
(1, '89631146'), 
(1, '20654247'),
(2, '46986421'),
(2, '75380687');

INSERT INTO archetype_type (archetype_id, type_id) VALUES 
(1, 4), 
(2, 3);

INSERT INTO archetype_attribute (archetype_id, attribute_id) VALUES 
(1, 6), 
(2, 5);

INSERT INTO archetype_summonmechanic (archetype_id, summonmechanic_id) VALUES 
(1, 3), 
(1, 4), 
(2, 4),
(2, 3);