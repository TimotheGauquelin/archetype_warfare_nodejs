-- Raisons de banlist (catalogue) + liaison M2M avec banlist_archetype_card

CREATE TABLE IF NOT EXISTS banlist_reason (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    label VARCHAR(120) NOT NULL,
    text TEXT NOT NULL,
    logo_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banlist_archetype_card_reason (
    id SERIAL PRIMARY KEY,
    banlist_archetype_card_id BIGINT NOT NULL,
    banlist_reason_id BIGINT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bacr_bac FOREIGN KEY (banlist_archetype_card_id)
        REFERENCES banlist_archetype_card (id) ON DELETE CASCADE,
    CONSTRAINT fk_bacr_reason FOREIGN KEY (banlist_reason_id)
        REFERENCES banlist_reason (id) ON DELETE CASCADE,
    CONSTRAINT uq_bacr_bac_reason UNIQUE (banlist_archetype_card_id, banlist_reason_id)
);

CREATE INDEX IF NOT EXISTS idx_bacr_bac ON banlist_archetype_card_reason (banlist_archetype_card_id);
CREATE INDEX IF NOT EXISTS idx_bacr_reason ON banlist_archetype_card_reason (banlist_reason_id);

INSERT INTO banlist_reason (slug, label, text, logo_url)
VALUES
    ('floodgate', 'Floodgate', 'Bloque l''adversaire sur le développement de son jeu', NULL),
    ('trop-versatile', 'Trop versatile', 'Carte trop polyvalente, ouvre trop de lignes ou d''extensions', NULL),
    ('ftk', 'FTK', 'Facilite ou accélère des stratégies FTK / OTK trop stables', NULL),
    ('richesse-promise', 'Richesse promise', 'Pioche trop libre ou trop récurrente sans vraie restriction', NULL),
    ('regime', 'Régime', 'Épuise trop facilement la main adverse, surtout hors once-per-turn', NULL),
    ('recyclage', 'Recyclage', 'Recycle trop efficacement et relance la main / le cimetière', NULL),
    ('essaim', 'Essaim / Swarm', 'Génère trop facilement des avancées monstre / combo', NULL),
    ('anti-jeu', 'Anti-jeu', 'Effet trop punitif ou trop bloquant pour le format', NULL),
    ('cout', 'Trop chère', 'Coût trop élevé pour le format / accessibilité', NULL),
    ('pas-encore-sorti', 'Pas encore sorti', 'Carte non disponible ou non souhaitée dans le format actuel', NULL),
    ('effet-puissant', 'Effet trop puissant', 'Impact brut trop élevé pour rester à 3', NULL),
    ('reset-duel', 'Reset de duel', 'Peut seule relancer un duel de façon trop forte', NULL),
    ('fusion-trop-facile', 'Fusion trop facile', 'Accède trop simplement à des fusions sans restriction', NULL),
    ('tutor', 'Tutor / Search', 'Cherche trop facilement des pièces clés du deck', NULL),
    ('defaut-banlist', 'Restriction banlist', 'Carte restreinte dans cette banlist', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Migration soft : rattache une raison quand explanation_text correspond clairement
INSERT INTO banlist_archetype_card_reason (banlist_archetype_card_id, banlist_reason_id, position)
SELECT bac.id, br.id, 0
FROM banlist_archetype_card bac
JOIN banlist_reason br ON (
    (br.slug = 'floodgate' AND bac.explanation_text ILIKE '%Floodgate%')
    OR (br.slug = 'ftk' AND bac.explanation_text ILIKE '%FTK%')
    OR (br.slug = 'richesse-promise' AND bac.explanation_text ILIKE '%Richesse promise%')
    OR (br.slug = 'regime' AND (bac.explanation_text ILIKE '%Régime%' OR bac.explanation_text ILIKE '%Regime%'))
    OR (br.slug = 'recyclage' AND bac.explanation_text ILIKE '%Recyclage%')
    OR (br.slug = 'essaim' AND (bac.explanation_text ILIKE '%Essaim%' OR bac.explanation_text ILIKE '%Swarm%'))
    OR (br.slug = 'anti-jeu' AND bac.explanation_text ILIKE '%Anti-jeu%')
    OR (br.slug = 'cout' AND bac.explanation_text ILIKE '%chere%')
    OR (br.slug = 'pas-encore-sorti' AND bac.explanation_text ILIKE '%Pas encore sorti%')
    OR (br.slug = 'effet-puissant' AND bac.explanation_text ILIKE '%Effet trop puissant%')
    OR (br.slug = 'reset-duel' AND bac.explanation_text ILIKE '%relancer un duel%')
    OR (br.slug = 'fusion-trop-facile' AND bac.explanation_text ILIKE '%Fusions sans restriction%')
    OR (br.slug = 'tutor' AND bac.explanation_text ILIKE '%Appel.%')
    OR (br.slug = 'trop-versatile' AND (
        bac.explanation_text ILIKE '%Trop Versatile%'
        OR bac.explanation_text ILIKE '%Trop versatile%'
        OR bac.explanation_text ILIKE '%Trop Polyvalent%'
        OR bac.explanation_text ILIKE '%Carte versatile%'
    ))
    OR (br.slug = 'defaut-banlist' AND bac.explanation_text ILIKE 'Carte limitée dans cette banlist')
)
ON CONFLICT (banlist_archetype_card_id, banlist_reason_id) DO NOTHING;
