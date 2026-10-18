-- Aligne card.attribute sur les labels de la table attribute (minuscules).
UPDATE card
SET attribute = LOWER(attribute)
WHERE attribute IS NOT NULL
  AND attribute <> LOWER(attribute);
