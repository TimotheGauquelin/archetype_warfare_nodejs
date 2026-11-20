-- Distingue clairement les titres Daily Quizz vs Circuit Tournoi

UPDATE medal SET title = 'Quizzeur Daily Quizz', description = 'Jouer à un Daily Quizz', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_PLAY';

UPDATE medal SET title = 'Bronze Daily Quizz', description = 'Obtenir 10 pts sur une saison Daily Quizz', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_DAILY_SESSION_10';

UPDATE medal SET title = 'Argent Daily Quizz', description = 'Obtenir 20 pts sur une saison Daily Quizz', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_DAILY_SESSION_20';

UPDATE medal SET title = 'Or Daily Quizz', description = 'Obtenir 50 pts sur une saison Daily Quizz', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_DAILY_SESSION_50';

UPDATE medal SET title = 'Centurion Daily Quizz', description = 'Atteindre 100 pts Daily Quizz au total', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_DAILY_TOTAL_100';

UPDATE medal SET title = 'Vétéran Daily Quizz', description = 'Atteindre 200 pts Daily Quizz au total', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_DAILY_TOTAL_200';

UPDATE medal SET title = 'Légende Daily Quizz', description = 'Atteindre 500 pts Daily Quizz au total', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_DAILY_TOTAL_500';

UPDATE medal SET title = 'Rang Bronze - Circuit Tournoi', description = 'Atteindre le palier Bronze sur le circuit tournois d''une saison', updated_at = CURRENT_TIMESTAMP
WHERE code = 'SEASON_TIER_BRONZE';

UPDATE medal SET title = 'Rang Argent - Circuit Tournoi', description = 'Atteindre le palier Argent sur le circuit tournois d''une saison', updated_at = CURRENT_TIMESTAMP
WHERE code = 'SEASON_TIER_ARGENT';

UPDATE medal SET title = 'Rang Or - Circuit Tournoi', description = 'Atteindre le palier Or sur le circuit tournois d''une saison', updated_at = CURRENT_TIMESTAMP
WHERE code = 'SEASON_TIER_OR';

UPDATE medal SET title = 'Rang Platine - Circuit Tournoi', description = 'Atteindre le palier Platine sur le circuit tournois d''une saison', updated_at = CURRENT_TIMESTAMP
WHERE code = 'SEASON_TIER_PLATINE';

UPDATE medal SET title = 'Rang Diamant - Circuit Tournoi', description = 'Atteindre le palier Diamant sur le circuit tournois d''une saison', updated_at = CURRENT_TIMESTAMP
WHERE code = 'SEASON_TIER_DIAMANT';

UPDATE medal SET title = 'Rang Master - Circuit Tournoi', description = 'Atteindre le palier Master sur le circuit tournois d''une saison', updated_at = CURRENT_TIMESTAMP
WHERE code = 'SEASON_TIER_MASTER';

UPDATE medal SET title = '1er - Circuit Tournoi', description = 'Finir 1er d''une saison circuit tournois', updated_at = CURRENT_TIMESTAMP
WHERE code = 'QUIZ_SESSION_FIRST';

UPDATE medal SET title = 'Double 1er - Circuit Tournoi & Daily Quizz', description = 'Finir 1er d''une saison circuit tournois & Daily Quizz en même temps', updated_at = CURRENT_TIMESTAMP
WHERE code = 'SEASON_DOUBLE_FIRST';
