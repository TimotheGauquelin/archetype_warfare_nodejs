-- Médailles (catalogue) + attributions utilisateurs

CREATE TABLE IF NOT EXISTS medal (
    id SERIAL PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    category VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT NULL,
    is_contextual BOOLEAN NOT NULL DEFAULT FALSE,
    threshold INT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_medal (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    medal_id INT NOT NULL REFERENCES medal (id) ON DELETE CASCADE,
    context_id VARCHAR(64) NOT NULL DEFAULT '',
    context_label VARCHAR(160) NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_medal_once UNIQUE (user_id, medal_id, context_id)
);

CREATE INDEX IF NOT EXISTS idx_user_medal_user ON user_medal (user_id);
CREATE INDEX IF NOT EXISTS idx_user_medal_medal ON user_medal (medal_id);
CREATE INDEX IF NOT EXISTS idx_medal_category ON medal (category);

INSERT INTO medal (code, category, title, description, is_contextual, threshold, sort_order)
VALUES
    ('DECK_COUNT_5', 'deck', 'Collectionneur', 'Créer 5 decks', FALSE, 5, 10),
    ('OFFICIAL_TOURNAMENT_PLAY', 'tournament', 'Compétiteur', 'Participer à un tournoi officiel', FALSE, 1, 20),
    ('OFFICIAL_TOURNAMENT_WIN', 'tournament', 'Champion', 'Gagner un tournoi officiel', FALSE, 1, 21),
    ('OFFICIAL_ARCHETYPE_WINS_2', 'tournament', 'Spécialiste', 'Gagner 2 tournois officiels avec le même archétype', TRUE, 2, 22),
    ('OFFICIAL_ARCHETYPE_WINS_3', 'tournament', 'Dominateur', 'Gagner 3 tournois officiels avec le même archétype', TRUE, 3, 23),
    ('MASTER_COUNT_1', 'archetype', 'Premier maître', 'Devenir maître d''un archétype', FALSE, 1, 30),
    ('MASTER_COUNT_10', 'archetype', 'Maître confirmé', 'Devenir maître de 10 archétypes', FALSE, 10, 31),
    ('MASTER_COUNT_50', 'archetype', 'Grand maître', 'Devenir maître de 50 archétypes', FALSE, 50, 32),
    ('MASTER_ARCHETYPE', 'archetype', 'Maître d''archétype', 'Devenir maître d''un archétype spécifique', TRUE, 1, 33),
    ('QUIZ_PLAY', 'quiz', 'Quizzeur', 'Jouer à un quizz', FALSE, 1, 40),
    ('QUIZ_SESSION_FIRST', 'quiz', 'Roi de la session', 'Finir 1er d''une session classée fermée', FALSE, 1, 41),
    ('QUIZ_DAILY_SESSION_10', 'quiz', 'Daily bronze', 'Obtenir 10 pts sur une session daily', FALSE, 10, 42),
    ('QUIZ_DAILY_SESSION_20', 'quiz', 'Daily argent', 'Obtenir 20 pts sur une session daily', FALSE, 20, 43),
    ('QUIZ_DAILY_SESSION_50', 'quiz', 'Daily or', 'Obtenir 50 pts sur une session daily', FALSE, 50, 44),
    ('QUIZ_DAILY_TOTAL_100', 'quiz', 'Centurion daily', 'Atteindre 100 pts daily au total', FALSE, 100, 45),
    ('QUIZ_DAILY_TOTAL_200', 'quiz', 'Vétéran daily', 'Atteindre 200 pts daily au total', FALSE, 200, 46),
    ('QUIZ_DAILY_TOTAL_500', 'quiz', 'Légende daily', 'Atteindre 500 pts daily au total', FALSE, 500, 47),
    ('ACCOUNT_AGE_7D', 'loyalty', 'Recrue', 'Compte actif depuis 1 semaine', FALSE, 7, 50),
    ('ACCOUNT_AGE_30D', 'loyalty', 'Habitué', 'Compte actif depuis 1 mois', FALSE, 30, 51),
    ('ACCOUNT_AGE_365D', 'loyalty', 'Ancien', 'Compte actif depuis 1 an', FALSE, 365, 52)
ON CONFLICT (code) DO NOTHING;
