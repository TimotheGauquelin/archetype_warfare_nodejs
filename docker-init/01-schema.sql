-- ==========================================
-- SCHÉMA : tables, séquences, fonctions, triggers, index
-- Exécuté à l'initialisation Docker (après 00-init.sql)
-- ==========================================

-- Tables
CREATE TABLE IF NOT EXISTS era (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

CREATE SEQUENCE IF NOT EXISTS archetype_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1;

CREATE TABLE IF NOT EXISTS archetype (
    id BIGINT DEFAULT nextval('archetype_id_seq') PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(80) UNIQUE,
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

ALTER TABLE IF EXISTS archetype
    ADD COLUMN IF NOT EXISTS slug VARCHAR(80) UNIQUE;

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

-- User avec UUID (non énumérable)
CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    reset_password_token TEXT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    has_accepted_terms_and_conditions BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT username_length_check CHECK (length(username) >= 3 AND length(username) <= 30),
    CONSTRAINT email_format_check CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

CREATE TABLE IF NOT EXISTS user_role (
    user_id UUID NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE
);

-- Deck avec UUID
CREATE TABLE IF NOT EXISTS deck (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(200) NOT NULL,
    comment TEXT,
    archetype_id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    is_playable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deck_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_deck_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_type (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    num_order INT NOT NULL UNIQUE
);

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

ALTER TABLE IF EXISTS card
    ADD COLUMN IF NOT EXISTS manual_update BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS banlist (
    id SERIAL PRIMARY KEY,
    label VARCHAR(200) NOT NULL UNIQUE,
    release_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS banlist
    ADD COLUMN IF NOT EXISTS is_event_banlist BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS card_status (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    "limit" INT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS deck_card (
    deck_id UUID NOT NULL,
    card_id VARCHAR(8) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_deck_card_deck FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE,
    CONSTRAINT fk_deck_card_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE
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
    CONSTRAINT fk_archetype_attr_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_archetype_attr_attribute FOREIGN KEY (attribute_id) REFERENCES attribute (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archetype_summonmechanic (
    archetype_id BIGINT NOT NULL,
    summonmechanic_id BIGINT NOT NULL,
    CONSTRAINT fk_archetype_sm_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_archetype_sm_summonmechanic FOREIGN KEY (summonmechanic_id) REFERENCES summonmechanic (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS banlist_archetype_card (
    id SERIAL PRIMARY KEY,
    banlist_id BIGINT NOT NULL,
    archetype_id BIGINT NULL,
    card_id VARCHAR(8) NOT NULL,
    card_status_id BIGINT NOT NULL,
    explanation_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bac_banlist FOREIGN KEY (banlist_id) REFERENCES banlist (id) ON DELETE CASCADE,
    CONSTRAINT fk_bac_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE CASCADE,
    CONSTRAINT fk_bac_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE,
    CONSTRAINT fk_bac_card_status FOREIGN KEY (card_status_id) REFERENCES card_status (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS website_actions (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    stream_banner_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    registration_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tournois (système suisse) — tournament en UUID
CREATE TABLE IF NOT EXISTS tournament (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    max_number_of_rounds INT NOT NULL CHECK (max_number_of_rounds >= 1),
    matches_per_round INT NOT NULL CHECK (matches_per_round IN (1, 3)),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('registration_open', 'registration_closed', 'tournament_beginning', 'tournament_in_progress', 'tournament_finished', 'tournament_cancelled')),
    current_round INT NOT NULL DEFAULT 0,
    until_winner BOOLEAN NOT NULL DEFAULT FALSE,
    require_deck_list BOOLEAN NOT NULL DEFAULT FALSE,
    max_players INT NULL,
    location VARCHAR(255) NULL,
    event_date TIMESTAMP NULL,
    event_date_end TIMESTAMP NULL,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    allow_penalities BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournament_player (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL,
    user_id UUID NOT NULL,
    deck_id UUID NULL,
    match_wins INT NOT NULL DEFAULT 0,
    match_losses INT NOT NULL DEFAULT 0,
    match_draws INT NOT NULL DEFAULT 0,
    games_won INT NOT NULL DEFAULT 0,
    games_played INT NOT NULL DEFAULT 0,
    dropped BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tp_tournament FOREIGN KEY (tournament_id) REFERENCES tournament (id) ON DELETE CASCADE,
    CONSTRAINT fk_tp_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_tp_deck FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE SET NULL,
    CONSTRAINT uq_tournament_user UNIQUE (tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS tournament_round (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL,
    round_number INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tr_tournament FOREIGN KEY (tournament_id) REFERENCES tournament (id) ON DELETE CASCADE,
    CONSTRAINT uq_tournament_round UNIQUE (tournament_id, round_number)
);

CREATE TABLE IF NOT EXISTS tournament_match (
    id SERIAL PRIMARY KEY,
    round_id INT NOT NULL,
    tournament_id UUID NOT NULL,
    player1_tournament_player_id INT NOT NULL,
    player2_tournament_player_id INT NULL,
    player1_games_won INT NOT NULL DEFAULT 0,
    player2_games_won INT NOT NULL DEFAULT 0,
    winner_tournament_player_id INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tm_round FOREIGN KEY (round_id) REFERENCES tournament_round (id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_tournament FOREIGN KEY (tournament_id) REFERENCES tournament (id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_player1 FOREIGN KEY (player1_tournament_player_id) REFERENCES tournament_player (id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_player2 FOREIGN KEY (player2_tournament_player_id) REFERENCES tournament_player (id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_winner FOREIGN KEY (winner_tournament_player_id) REFERENCES tournament_player (id) ON DELETE SET NULL,
    CONSTRAINT chk_tm_players_different CHECK (player2_tournament_player_id IS NULL OR player1_tournament_player_id != player2_tournament_player_id)
);

-- Snapshot du deck au verrouillage des inscriptions (liste figée pour le tournoi)
CREATE TABLE IF NOT EXISTS tournament_player_deck (
    id SERIAL PRIMARY KEY,
    tournament_player_id INT NOT NULL UNIQUE,
    label VARCHAR(200) NOT NULL,
    archetype_id BIGINT NULL,
    is_playable BOOLEAN NOT NULL DEFAULT FALSE,
    snapshot_by_user_id UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tpd_tournament_player FOREIGN KEY (tournament_player_id) REFERENCES tournament_player (id) ON DELETE CASCADE,
    CONSTRAINT fk_tpd_archetype FOREIGN KEY (archetype_id) REFERENCES archetype (id) ON DELETE SET NULL,
    CONSTRAINT fk_tpd_snapshot_by_user FOREIGN KEY (snapshot_by_user_id) REFERENCES "user" (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tournament_player_deck_card (
    id SERIAL PRIMARY KEY,
    tournament_player_deck_id INT NOT NULL,
    card_id VARCHAR(8) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_tpdc_deck FOREIGN KEY (tournament_player_deck_id) REFERENCES tournament_player_deck (id) ON DELETE CASCADE,
    CONSTRAINT fk_tpdc_card FOREIGN KEY (card_id) REFERENCES card (id) ON DELETE CASCADE
);

-- Types de pénalité (référentiel KDE / Konami)
CREATE TABLE IF NOT EXISTS penalty_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    severity INT NOT NULL
);

-- Pénalités appliquées aux joueurs d'un tournoi
CREATE TABLE IF NOT EXISTS tournament_player_penalty (
    id SERIAL PRIMARY KEY,
    tournament_player_id INT NOT NULL,
    penalty_type_id INT NOT NULL,
    round_id INT NULL,
    tournament_match_id INT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_by_user_id UUID NULL,
    reason TEXT NULL,
    notes TEXT NULL,
    disqualification_with_prize BOOLEAN NULL,
    written_statement_sent_at TIMESTAMP NULL,
    CONSTRAINT fk_tpp_tournament_player FOREIGN KEY (tournament_player_id) REFERENCES tournament_player (id) ON DELETE CASCADE,
    CONSTRAINT fk_tpp_penalty_type FOREIGN KEY (penalty_type_id) REFERENCES penalty_type (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tpp_round FOREIGN KEY (round_id) REFERENCES tournament_round (id) ON DELETE SET NULL,
    CONSTRAINT fk_tpp_match FOREIGN KEY (tournament_match_id) REFERENCES tournament_match (id) ON DELETE SET NULL,
    CONSTRAINT fk_tpp_applied_by FOREIGN KEY (applied_by_user_id) REFERENCES "user" (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tournament_player_penalty_tournament_player ON tournament_player_penalty (tournament_player_id);

-- Colonnes disqualification sur tournament_player (exclusion du tournoi)
ALTER TABLE tournament_player ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMP NULL;
ALTER TABLE tournament_player ADD COLUMN IF NOT EXISTS disqualified_reason TEXT NULL;
-- Pénalité pour deck ajouté après la fermeture des inscriptions
ALTER TABLE tournament_player ADD COLUMN IF NOT EXISTS late_deck_penalty BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tournament_status ON tournament (status);
CREATE INDEX IF NOT EXISTS idx_tournament_player_tournament ON tournament_player (tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_round_tournament ON tournament_round (tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_match_round ON tournament_match (round_id);
CREATE INDEX IF NOT EXISTS idx_tournament_match_tournament ON tournament_match (tournament_id);

-- Colonne is_playable sur deck (40-60 cartes = jouable)
ALTER TABLE deck ADD COLUMN IF NOT EXISTS is_playable BOOLEAN NOT NULL DEFAULT FALSE;

-- Colonne require_deck_list sur tournament (deck list obligatoire ou non)
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS require_deck_list BOOLEAN NOT NULL DEFAULT FALSE;

-- Colonne allow_penalities sur tournament (autorise l'ajout de pénalités par un admin)
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS allow_penalities BOOLEAN NOT NULL DEFAULT FALSE;

-- Index sur "user"
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user" (username);
CREATE INDEX IF NOT EXISTS idx_user_is_active ON "user" (is_active);
CREATE INDEX IF NOT EXISTS idx_user_is_banned ON "user" (is_banned);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "user" (created_at);

-- Fonctions
CREATE OR REPLACE FUNCTION check_username_constraints()
RETURNS TRIGGER AS $$
BEGIN
    IF LENGTH(NEW.username) < 3 OR LENGTH(NEW.username) > 30 THEN
        RAISE EXCEPTION 'Le nom d''utilisateur doit contenir entre 3 et 30 caractères.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_password_not_null()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password IS NULL AND OLD.password IS NOT NULL THEN
        RAISE EXCEPTION 'Le mot de passe ne peut pas être vide après la première modification';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS check_username_before_insert_or_update ON "user";
CREATE TRIGGER check_username_before_insert_or_update
    BEFORE INSERT OR UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION check_username_constraints();

DROP TRIGGER IF EXISTS password_update_check ON "user";
CREATE TRIGGER password_update_check
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION enforce_password_not_null();

DROP TRIGGER IF EXISTS archetype_requirements_check ON archetype;
CREATE TRIGGER archetype_requirements_check
    BEFORE UPDATE ON archetype
    FOR EACH ROW
    EXECUTE FUNCTION check_archetype_requirements();

DROP TRIGGER IF EXISTS update_user_updated_at ON "user";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Slugs des archétypes (à exécuter après chargement de données si des lignes existent sans slug)
UPDATE archetype SET slug = 'dragon-arme' WHERE name = 'Dragon Armé' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'batosushi' WHERE name = 'Batosushi' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 't-g' WHERE name = 'T.G' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'guepe-de-bataille' WHERE name = 'Guêpe de Bataille' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'vaylantz' WHERE name = 'Vaylantz' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'spadassin-des-flammes' WHERE name = 'Spadassin des Flammes' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'amazonesse' WHERE name = 'Amazonesse' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'chevalier-etoile' WHERE name = 'Chevalier Etoilé' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'ferique' WHERE name = 'Féérique' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'nouvelles' WHERE name = 'Nouvelles' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'cendre' WHERE name = 'Cendré' AND (slug IS NULL OR slug = '');
UPDATE archetype SET slug = 'gardien-de-la-porte' WHERE name = 'Gardien de la Porte' AND (slug IS NULL OR slug = '');
