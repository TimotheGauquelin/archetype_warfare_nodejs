-- Remplace espaces (et tirets) dans les slugs d'archétype par des underscores.
-- Ex. "armed dragon" / "armed-dragon" → "armed_dragon"

UPDATE archetype
SET slug = regexp_replace(
  regexp_replace(lower(trim(slug)), '[\s\-]+', '_', 'g'),
  '^_|_$',
  '',
  'g'
)
WHERE slug IS NOT NULL
  AND slug ~* '[\s\-]';
