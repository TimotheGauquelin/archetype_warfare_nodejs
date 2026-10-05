-- Migration idempotente pour bases déjà initialisées
CREATE TABLE IF NOT EXISTS archetype_translation (
    archetype_id BIGINT NOT NULL REFERENCES archetype(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(50) NOT NULL,
    main_info TEXT NULL,
    slider_info TEXT NULL,
    comment TEXT NULL,
    PRIMARY KEY (archetype_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_archetype_translation_locale ON archetype_translation(locale);
CREATE INDEX IF NOT EXISTS idx_archetype_translation_name ON archetype_translation(name);

-- Seed FR depuis les lignes existantes (fallback canonique actuel)
INSERT INTO archetype_translation (archetype_id, locale, name, main_info, slider_info, comment)
SELECT id, 'fr', name, main_info, slider_info, comment
FROM archetype
ON CONFLICT (archetype_id, locale) DO NOTHING;
