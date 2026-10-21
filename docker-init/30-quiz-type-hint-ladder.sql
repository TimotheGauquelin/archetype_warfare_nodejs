-- Type de question « Indices » (hint_ladder)
ALTER TABLE quiz_question
    DROP CONSTRAINT IF EXISTS chk_quiz_question_type;

ALTER TABLE quiz_question
    ADD CONSTRAINT chk_quiz_question_type
    CHECK (type IN (
        'mcq',
        'true_false',
        'order',
        'artwork_guess',
        'name_the_cards',
        'summoner',
        'zoom',
        'hint_ladder'
    ));
