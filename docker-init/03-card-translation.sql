-- Migration idempotente pour bases déjà initialisées
CREATE TABLE IF NOT EXISTS card_translation (
    card_id VARCHAR(8) NOT NULL REFERENCES card(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    PRIMARY KEY (card_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_card_translation_locale ON card_translation(locale);
CREATE INDEX IF NOT EXISTS idx_card_translation_name ON card_translation(name);
