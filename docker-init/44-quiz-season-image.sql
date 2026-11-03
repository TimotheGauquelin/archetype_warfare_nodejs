-- Image d'illustration d'une saison Daily Quizz
ALTER TABLE quiz_season
    ADD COLUMN IF NOT EXISTS image_url TEXT NULL;
