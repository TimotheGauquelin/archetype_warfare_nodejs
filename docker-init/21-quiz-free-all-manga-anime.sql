-- Partie libre : thème "Toutes les questions" + label Manga & Anime

UPDATE quiz_theme
SET label = 'Manga & Anime',
    description = 'Questions sur le manga et les animés Yu-Gi-Oh!',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'manga';

INSERT INTO quiz_theme (slug, label, description)
VALUES
    ('all', 'Toutes les questions', 'Mix aléatoire de questions tous thèmes confondus')
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
