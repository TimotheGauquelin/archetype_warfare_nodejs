-- Accélère la recherche deck builder (EXISTS BAC + ILIKE noms).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- banlist_archetype_card : lookups par carte / archétype
CREATE INDEX IF NOT EXISTS idx_bac_card_id
  ON banlist_archetype_card (card_id);

CREATE INDEX IF NOT EXISTS idx_bac_archetype_id
  ON banlist_archetype_card (archetype_id)
  WHERE archetype_id IS NOT NULL AND archetype_id <> 0;

CREATE INDEX IF NOT EXISTS idx_bac_card_archetype
  ON banlist_archetype_card (card_id, archetype_id);

CREATE INDEX IF NOT EXISTS idx_bac_archetype_card
  ON banlist_archetype_card (archetype_id, card_id)
  WHERE archetype_id IS NOT NULL AND archetype_id <> 0;

-- Recherche texte (ILIKE %…%) via trigram
CREATE INDEX IF NOT EXISTS idx_card_name_trgm
  ON card USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_card_translation_name_trgm
  ON card_translation USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_card_translation_card_locale
  ON card_translation (card_id, locale);
