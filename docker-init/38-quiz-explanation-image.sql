-- Image optionnelle pour l'explication d'une question

ALTER TABLE quiz_question
    ADD COLUMN IF NOT EXISTS explanation_image_url TEXT NULL;
