type CacheEntry = {
    etag: string;
    body: Record<string, unknown> | null;
    expiresAt: number;
};

const TTL_MS = 60_000;
const store = new Map<string, CacheEntry>();

export const getCurrentBanlistCacheKey = (includeArchetypeCards: boolean): string =>
    includeArchetypeCards ? 'with-archetypes' : 'generics-only';

export const readCurrentBanlistCache = (
    key: string
): CacheEntry | null => {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
    }
    return entry;
};

export const writeCurrentBanlistCache = (
    key: string,
    body: Record<string, unknown> | null
): CacheEntry => {
    const updatedAt = body?.updated_at ? new Date(String(body.updated_at)).getTime() : 0;
    const id = body?.id ?? 0;
    const count = Array.isArray(body?.banlist_archetype_cards)
        ? body.banlist_archetype_cards.length
        : 0;
    const etag = `"bl-${id}-${updatedAt}-${key}-${count}"`;
    const entry: CacheEntry = {
        etag,
        body,
        expiresAt: Date.now() + TTL_MS,
    };
    store.set(key, entry);
    return entry;
};

export const clearCurrentBanlistCache = (): void => {
    store.clear();
};
