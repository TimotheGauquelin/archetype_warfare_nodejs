-- Types monstre manquants
INSERT INTO type (id, label) VALUES
    (23, 'illusion'),
    (24, 'winged-beast'),
    (25, 'zombie')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

SELECT setval(
    pg_get_serial_sequence('type', 'id'),
    GREATEST((SELECT MAX(id) FROM type), 25)
);
