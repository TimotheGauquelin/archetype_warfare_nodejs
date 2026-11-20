/**
 * Normalise un slug : minuscules, sans accents, séparateurs → `_`.
 * Ex. "Armed Dragon" → "armed_dragon"
 */
export function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}
