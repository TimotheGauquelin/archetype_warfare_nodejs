CREATE TABLE
    IF NOT EXISTS attribute (
        id SERIAL PRIMARY KEY,
        label VARCHAR(50) NOT NULL UNIQUE
    );

CREATE TABLE
    IF NOT EXISTS era (
        id SERIAL PRIMARY KEY,
        label VARCHAR(50) NOT NULL UNIQUE
    );

INSERT INTO
    attribute (id, label)
VALUES
    (1, 'Fire'),
    (2, 'Water'),
    (3, 'Earth'),
    (4, 'Wind'),
    (5, 'Dark'),
    (6, 'Light');

INSERT INTO
    era (id, label)
VALUES
    (1, 'DM'),
    (2, 'GX'),
    (3, '5Ds'),
    (4, 'Zexal'),
    (5, 'Arc V'),
    (6, 'Vrain'),
    (7, 'Modern'),
    (8, 'Chronicles');