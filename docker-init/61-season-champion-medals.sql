-- Renomme « Roi de la session » → 1er circuit tournoi de saison
-- + médaille double champion (1er circuit tournois ET 1er Daily Quizz, même saison)

UPDATE medal
SET
    category = 'season',
    title = '1er - Circuit Tournoi',
    description = 'Finir 1er d''une saison circuit tournois',
    sort_order = 66,
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_SESSION_FIRST';

INSERT INTO medal (code, category, title, description, is_contextual, threshold, sort_order)
VALUES
    (
        'SEASON_DOUBLE_FIRST',
        'season',
        'Double 1er - Circuit Tournoi & Daily Quizz',
        'Finir 1er d''une saison circuit tournois & Daily Quizz en même temps',
        FALSE,
        1,
        67
    )
ON CONFLICT (code) DO NOTHING;
