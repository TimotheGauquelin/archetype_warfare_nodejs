-- Médailles lifetime des paliers circuit tournoi de saison (sans Novice).
-- threshold = points minimum du palier (aligné sur seasonTournamentRank).

INSERT INTO medal (code, category, title, description, is_contextual, threshold, sort_order)
VALUES
    (
        'SEASON_TIER_BRONZE',
        'season',
        'Rang Bronze - Circuit Tournoi',
        'Atteindre le palier Bronze sur le circuit tournois d''une saison',
        FALSE,
        5,
        60
    ),
    (
        'SEASON_TIER_ARGENT',
        'season',
        'Rang Argent - Circuit Tournoi',
        'Atteindre le palier Argent sur le circuit tournois d''une saison',
        FALSE,
        10,
        61
    ),
    (
        'SEASON_TIER_OR',
        'season',
        'Rang Or - Circuit Tournoi',
        'Atteindre le palier Or sur le circuit tournois d''une saison',
        FALSE,
        20,
        62
    ),
    (
        'SEASON_TIER_PLATINE',
        'season',
        'Rang Platine - Circuit Tournoi',
        'Atteindre le palier Platine sur le circuit tournois d''une saison',
        FALSE,
        35,
        63
    ),
    (
        'SEASON_TIER_DIAMANT',
        'season',
        'Rang Diamant - Circuit Tournoi',
        'Atteindre le palier Diamant sur le circuit tournois d''une saison',
        FALSE,
        50,
        64
    ),
    (
        'SEASON_TIER_MASTER',
        'season',
        'Rang Master - Circuit Tournoi',
        'Atteindre le palier Master sur le circuit tournois d''une saison',
        FALSE,
        100,
        65
    )
ON CONFLICT (code) DO NOTHING;
