
DELETE FROM banlist_archetype_card bac
USING card_status cs
WHERE bac.card_status_id = cs.id
  AND bac.archetype_id IS NULL
  AND LOWER(cs.label) = 'unlimited';
