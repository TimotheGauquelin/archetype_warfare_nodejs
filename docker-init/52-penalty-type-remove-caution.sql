-- La caution (avertissement mineur) n'existe plus : basculer les pénalités
-- existantes vers warning, puis supprimer le type.
UPDATE tournament_player_penalty
SET penalty_type_id = (SELECT id FROM penalty_type WHERE code = 'warning' LIMIT 1)
WHERE penalty_type_id IN (SELECT id FROM penalty_type WHERE code = 'caution');

DELETE FROM penalty_type WHERE code = 'caution';
