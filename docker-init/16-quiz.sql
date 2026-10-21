-- Quizz : thèmes, questions (mcq / true_false), quotidien, tentatives

CREATE TABLE IF NOT EXISTS quiz_theme (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_question (
    id BIGSERIAL PRIMARY KEY,
    theme_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,
    prompt TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    points INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT NULL,
    hint TEXT NULL,
    explanation TEXT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_question_theme FOREIGN KEY (theme_id) REFERENCES quiz_theme (id) ON DELETE CASCADE,
    CONSTRAINT chk_quiz_question_type CHECK (type IN ('mcq', 'true_false', 'artwork_guess', 'name_the_cards')),
    CONSTRAINT chk_quiz_question_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_theme_type_active
    ON quiz_question (theme_id, type, is_active);

CREATE TABLE IF NOT EXISTS quiz_daily (
    id BIGSERIAL PRIMARY KEY,
    quiz_date DATE NOT NULL UNIQUE,
    theme_id BIGINT NOT NULL,
    question_ids BIGINT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_daily_theme FOREIGN KEY (theme_id) REFERENCES quiz_theme (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    theme_id BIGINT NOT NULL,
    mode VARCHAR(20) NOT NULL,
    daily_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    score INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL DEFAULT 0,
    question_ids BIGINT[] NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL,
    CONSTRAINT fk_quiz_attempt_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_attempt_theme FOREIGN KEY (theme_id) REFERENCES quiz_theme (id) ON DELETE CASCADE,
    CONSTRAINT chk_quiz_attempt_mode CHECK (mode IN ('free', 'daily')),
    CONSTRAINT chk_quiz_attempt_status CHECK (status IN ('in_progress', 'finished'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_attempt_daily_user
    ON quiz_attempt (user_id, daily_date)
    WHERE mode = 'daily' AND daily_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_user ON quiz_attempt (user_id);

CREATE TABLE IF NOT EXISTS quiz_answer (
    id BIGSERIAL PRIMARY KEY,
    attempt_id UUID NOT NULL,
    question_id BIGINT NOT NULL,
    answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded INT NOT NULL DEFAULT 0,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_answer_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempt (id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_answer_question FOREIGN KEY (question_id) REFERENCES quiz_question (id) ON DELETE CASCADE,
    CONSTRAINT uq_quiz_answer_attempt_question UNIQUE (attempt_id, question_id)
);

-- Thèmes de base
INSERT INTO quiz_theme (slug, label, description)
VALUES
    ('all', 'Toutes les questions', 'Mix aléatoire de questions tous thèmes confondus'),
    ('manga', 'Manga & Anime', 'Questions sur le manga et les animés Yu-Gi-Oh!'),
    ('anime', 'Anime', 'Questions sur les animés Yu-Gi-Oh!'),
    ('jeu-de-cartes', 'Jeu de Cartes', 'Questions sur le jeu de cartes Yu-Gi-Oh! (TCG / OCG)'),
    ('culture-g', 'Culture G', 'Culture générale autour de Yu-Gi-Oh! et de son univers'),
    ('jeu-video', 'Jeu Video', 'Questions sur les jeux vidéo Yu-Gi-Oh!')
ON CONFLICT (slug) DO NOTHING;

-- Questions de démo (mcq + true_false)
INSERT INTO quiz_question (theme_id, type, prompt, payload, points)
SELECT t.id, q.type, q.prompt, q.payload::jsonb, 1
FROM quiz_theme t
CROSS JOIN (
    VALUES
        ('manga', 'mcq', 'Quel est le nom du rival emblématique de Yugi Mutou ?', '{"choices":["Seto Kaiba","Joey Wheeler","Maximillion Pegasus","Marik Ishtar"],"correctIndex":0}'),
        ('manga', 'mcq', 'Comment s''appelle le puzzle millénaire de Yugi ?', '{"choices":["Le Puzzle du Millénium","L''Œil du Millénium","Le Collier du Millénium","La Clé du Millénium"],"correctIndex":0}'),
        ('manga', 'true_false', 'Dans le manga original, Yugi et Yami Yugi sont la même personne physique.', '{"correct":false}'),
        ('manga', 'true_false', 'Le Magicien Sombre est le monstre signature de Yugi.', '{"correct":true}'),
        ('manga', 'mcq', 'Qui a créé le jeu de Duel de Monstres dans l''univers fictionnel ?', '{"choices":["Maximillion Pegasus","Seto Kaiba","Solomon Muto","Dartz"],"correctIndex":0}'),
        ('jeu-de-cartes', 'mcq', 'Combien de cartes faut-il au minimum dans un Main Deck (format avancé) ?', '{"choices":["40","30","45","60"],"correctIndex":0}'),
        ('jeu-de-cartes', 'mcq', 'Quel est le statut de banlist le plus restrictif ?', '{"choices":["Forbidden","Limited","Semi-Limited","Unlimited"],"correctIndex":0}'),
        ('jeu-de-cartes', 'true_false', 'Un Link Monster a des DEF imprimées sur la carte.', '{"correct":false}'),
        ('jeu-de-cartes', 'true_false', 'On peut avoir jusqu''à 3 exemplaires d''une carte Unlimited dans un deck.', '{"correct":true}'),
        ('jeu-de-cartes', 'mcq', 'Quelle invocation utilise des matériaux empilés sous le monstre ?', '{"choices":["Xyz","Synchro","Fusion","Link"],"correctIndex":0}')
) AS q(theme_slug, type, prompt, payload)
WHERE t.slug = q.theme_slug
  AND NOT EXISTS (
      SELECT 1 FROM quiz_question existing
      WHERE existing.theme_id = t.id AND existing.prompt = q.prompt
  );
