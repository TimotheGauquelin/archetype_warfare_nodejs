-- Marque non jouables les decks qui contiennent des cartes liées uniquement
-- à d'autres archétypes que celui du deck (is_playable resté true après migration BAC).
UPDATE deck d
SET is_playable = false,
    updated_at = NOW()
WHERE d.is_playable = true
  AND d.archetype_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM deck_card dc
    WHERE dc.deck_id = d.id
      AND EXISTS (
        SELECT 1
        FROM banlist_archetype_card bac
        WHERE bac.card_id = dc.card_id
          AND bac.archetype_id IS NOT NULL
          AND bac.archetype_id <> 0
      )
      AND NOT EXISTS (
        SELECT 1
        FROM banlist_archetype_card bac2
        WHERE bac2.card_id = dc.card_id
          AND bac2.archetype_id = d.archetype_id
      )
  );
