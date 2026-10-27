-- Sépare Manga / Anime (plus de libellé fusionné) + thème Produits dérivés

UPDATE quiz_theme
SET label = 'Manga',
    description = 'Questions sur le manga Yu-Gi-Oh!',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'manga';

INSERT INTO quiz_theme (slug, label, description)
VALUES
    ('anime', 'Anime', 'Questions sur les animés Yu-Gi-Oh!'),
    (
        'produits-derives',
        'Produits dérivés',
        'Questions sur les produits dérivés Yu-Gi-Oh! (goodies, figurines, etc.)'
    )
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
