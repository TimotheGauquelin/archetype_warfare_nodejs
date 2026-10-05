import { Card, Archetype, Type, Attribute, SummonMechanic, BanlistArchetypeCard, CardStatus, CardTranslation } from '../models/relations';
import { Op, WhereOptions } from 'sequelize';
import sequelize from '../config/Sequelize';

interface SearchFilters {
    name?: string;
    card_type?: string;
    level?: number;
    min_atk?: number;
    max_atk?: number;
    min_def?: number;
    max_def?: number;
    attribute?: string;
    page?: number;
    size?: number;
    locale?: string;
}

export type CardLocale = 'fr' | 'en';

interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage: number | null;
        previousPage: number | null;
    };
}

interface CardTranslationInput {
    locale: string;
    name: string;
    description?: string | null;
}

interface CardData {
    id: string;
    name: string;
    description?: string;
    img_url?: string;
    level?: number;
    atk?: number;
    def?: number;
    attribute?: string;
    card_type?: string;
    translations?: CardTranslationInput[];
}

/** Données modifiables pour une mise à jour manuelle (PUT /api/cards/:id). */
export interface CardUpdateData {
    name?: string;
    description?: string | null;
    img_url?: string | null;
    level?: number | null;
    atk?: number | null;
    def?: number | null;
    attribute?: string | null;
    card_type?: string | null;
    locale?: string;
}

const DEFAULT_BANLIST_ID_FOR_NEW_CARDS = 1;
const DEFAULT_CARD_STATUS_ID_UNLIMITED = 4;

class CardService {
    /**
     * Crée une entrée banlist générique si aucune ligne banlist_archetype_card
     * n'existe encore pour ce card_id (banlist 1, archetype NULL, status unlimited).
     */
    static async ensureDefaultBanlistEntryForNewCard(cardId: string): Promise<boolean> {
        const existingCount = await BanlistArchetypeCard.count({
            where: { card_id: cardId },
        });

        if (existingCount > 0) {
            return false;
        }

        await BanlistArchetypeCard.create({
            banlist_id: DEFAULT_BANLIST_ID_FOR_NEW_CARDS,
            archetype_id: null,
            card_id: cardId,
            card_status_id: DEFAULT_CARD_STATUS_ID_UNLIMITED,
            explanation_text: null,
        });

        return true;
    }

    static normalizeLocale(locale?: string | null): CardLocale {
        const value = String(locale || 'fr').trim().toLowerCase();
        return value === 'en' ? 'en' : 'fr';
    }

    /**
     * Remplace name/description par la traduction demandée (fallback: champs de `card`).
     */
    static async applyLocaleToCardRecords<T extends { id: string; name?: string; description?: string | null }>(
        records: T[],
        locale?: string | null
    ): Promise<T[]> {
        if (!records.length) {
            return records;
        }

        const normalizedLocale = CardService.normalizeLocale(locale);
        const ids = records.map((record) => String(record.id));
        const translations = await CardTranslation.findAll({
            where: {
                card_id: { [Op.in]: ids },
                locale: normalizedLocale,
            },
        });

        const byCardId = new Map(translations.map((translation) => [translation.card_id, translation]));

        return records.map((record) => {
            const translation = byCardId.get(String(record.id));
            if (!translation) {
                return record;
            }

            return {
                ...record,
                name: translation.name,
                description: translation.description ?? record.description ?? null,
            };
        });
    }

    static buildNameSearchWhere(name: string, locale?: string | null): WhereOptions {
        const normalizedLocale = CardService.normalizeLocale(locale);
        const pattern = `%${name}%`;

        return {
            [Op.or]: [
                { name: { [Op.iLike]: pattern } },
                sequelize.literal(`EXISTS (
                    SELECT 1
                    FROM card_translation ct
                    WHERE ct.card_id = "Card"."id"
                      AND ct.locale = ${sequelize.escape(normalizedLocale)}
                      AND ct.name ILIKE ${sequelize.escape(pattern)}
                )`),
            ],
        };
    }

    /**
     * Upsert les traductions d'une carte.
     * Si aucune traduction n'est fournie, crée/met à jour la locale `en` depuis name/description.
     */
    static async upsertCardTranslations(
        cardId: string,
        cardData: Pick<CardData, 'name' | 'description' | 'translations'>
    ): Promise<void> {
        const translations: CardTranslationInput[] =
            cardData.translations && cardData.translations.length > 0
                ? cardData.translations
                : [
                      {
                          locale: 'en',
                          name: cardData.name,
                          description: cardData.description ?? null,
                      },
                  ];

        for (const translation of translations) {
            const locale = translation.locale?.trim().toLowerCase();
            if (!locale || !translation.name) {
                continue;
            }

            await CardTranslation.upsert({
                card_id: cardId,
                locale,
                name: translation.name,
                description: translation.description ?? null,
            });
        }
    }

    /** Récupère une carte par son ID (détail), avec les archétypes liés via banlist. */
    static async getCardById(id: string, locale?: string): Promise<(Card & Record<string, unknown>) | null> {
        const card = await Card.findByPk(id, {
            include: [
                {
                    model: BanlistArchetypeCard,
                    as: 'banlist_archetype_cards',
                    required: false,
                    attributes: ['id', 'archetype_id', 'banlist_id', 'card_status_id'],
                    include: [
                        {
                            model: Archetype,
                            as: 'archetype',
                            required: false,
                            attributes: ['id', 'name', 'slug'],
                        },
                    ],
                },
            ],
        });
        if (!card) {
            return null;
        }

        const cardJson = card.toJSON() as Card & {
            id: string;
            banlist_archetype_cards?: Array<{
                archetype_id: number | null;
                archetype?: { id: number; name: string; slug: string } | null;
            }>;
        };

        const [localized] = await CardService.applyLocaleToCardRecords([cardJson], locale);

        const archetypesById = new Map<number, { id: number; name: string; slug: string }>();
        let isGeneric = false;

        for (const bac of cardJson.banlist_archetype_cards ?? []) {
            if (bac.archetype_id == null || bac.archetype_id === 0) {
                isGeneric = true;
                continue;
            }
            if (bac.archetype) {
                archetypesById.set(bac.archetype.id, bac.archetype);
            }
        }

        const { banlist_archetype_cards: _bac, ...rest } = localized as typeof localized & {
            banlist_archetype_cards?: unknown;
        };

        return {
            ...rest,
            archetypes: Array.from(archetypesById.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
            ),
            is_generic: isGeneric,
        } as unknown as Card & Record<string, unknown>;
    }

    /**
     * Met à jour une carte (détails) et positionne manual_update à true.
     * name/description sont synchronisés dans card_translation pour la locale fournie.
     * La table card (canon EN) n'est écrasée pour name/description que si locale = en.
     */
    static async updateCard(id: string, data: CardUpdateData): Promise<(Card & Record<string, unknown>) | null> {
        const card = await Card.findByPk(id);
        if (!card) return null;

        const locale = CardService.normalizeLocale(data.locale);
        const { locale: _locale, name, description, ...scalarFields } = data;

        const updates: Record<string, unknown> = { manual_update: true };
        for (const [key, value] of Object.entries(scalarFields)) {
            if (value !== undefined) updates[key] = value;
        }

        if (locale === 'en') {
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
        }

        await card.update(updates);
        await card.reload();

        if (name !== undefined || description !== undefined) {
            const existingTranslation = await CardTranslation.findOne({
                where: { card_id: id, locale },
            });

            await CardTranslation.upsert({
                card_id: id,
                locale,
                name: name ?? existingTranslation?.name ?? card.name,
                description:
                    description !== undefined
                        ? description
                        : (existingTranslation?.description ?? card.description ?? null),
            });
        }

        return CardService.getCardById(id, locale);
    }

    static async getAllCards(): Promise<Card[]> {
        return Card.findAll({
            include: [
                { model: Archetype },
                { model: Type },
                { model: Attribute },
                { model: SummonMechanic }
            ]
        });
    }

    static async searchCards(filters: SearchFilters): Promise<PaginatedResult<Card>> {
        const {
            name,
            card_type,
            level,
            min_atk,
            max_atk,
            min_def,
            max_def,
            attribute,
            page = 1,
            size = 10,
            locale
        } = filters;

        const limit = parseInt(String(size));
        const offset = (parseInt(String(page)) - 1) * limit;

        const where: WhereOptions = {};

        if (name) {
            Object.assign(where, CardService.buildNameSearchWhere(name, locale));
        }

        if (level) {
            where.level = parseInt(String(level));
        }

        if (min_atk || max_atk) {
            where.atk = {} as any;
            if (min_atk) {
                where.atk[Op.gte] = parseInt(String(min_atk));
            }
            if (max_atk) {
                where.atk[Op.lte] = parseInt(String(max_atk));
            }
        }

        if (min_def || max_def) {
            where.def = {} as any;
            if (min_def) {
                where.def[Op.gte] = parseInt(String(min_def));
            }
            if (max_def) {
                where.def[Op.lte] = parseInt(String(max_def));
            }
        }

        if (attribute) {
            where.attribute = {
                [Op.iLike]: `%${attribute}%`
            };
        }

        if (card_type) {
            where.card_type = {
                [Op.iLike]: `%${card_type}%`
            };
        }

        const result = await Card.findAndCountAll({
            where,
            limit,
            offset,
            order: [['name', 'ASC']],
            distinct: true
        });

        const localizedRows = await CardService.applyLocaleToCardRecords(
            result.rows.map((row) => row.toJSON() as Card & { id: string }),
            locale
        );

        const totalPages = Math.ceil(result.count / limit);
        const hasNextPage = parseInt(String(page)) < totalPages;
        const hasPreviousPage = parseInt(String(page)) > 1;

        return {
            data: localizedRows as Card[],
            pagination: {
                total: result.count,
                totalPages: totalPages,
                currentPage: parseInt(String(page)),
                pageSize: limit,
                hasNextPage: hasNextPage,
                hasPreviousPage: hasPreviousPage,
                nextPage: hasNextPage ? parseInt(String(page)) + 1 : null,
                previousPage: hasPreviousPage ? parseInt(String(page)) - 1 : null
            }
        };
    }

    static async searchCardsByArchetypeBanlist(archetypeId: number, filters: SearchFilters): Promise<PaginatedResult<Card & { card_status: CardStatus | null }>> {
        const {
            name,
            card_type,
            level,
            min_atk,
            max_atk,
            min_def,
            max_def,
            attribute,
            page = 1,
            size = 10,
            locale
        } = filters;

        const limit = parseInt(String(size));
        const offset = (parseInt(String(page)) - 1) * limit;

        const cardWhere: WhereOptions = {};

        if (name) {
            Object.assign(cardWhere, CardService.buildNameSearchWhere(name, locale));
        }

        if (level) {
            cardWhere.level = parseInt(String(level));
        }

        if (min_atk || max_atk) {
            cardWhere.atk = {} as any;
            if (min_atk) {
                cardWhere.atk[Op.gte] = parseInt(String(min_atk));
            }
            if (max_atk) {
                cardWhere.atk[Op.lte] = parseInt(String(max_atk));
            }
        }

        if (min_def || max_def) {
            cardWhere.def = {} as any;
            if (min_def) {
                cardWhere.def[Op.gte] = parseInt(String(min_def));
            }
            if (max_def) {
                cardWhere.def[Op.lte] = parseInt(String(max_def));
            }
        }

        if (attribute) {
            cardWhere.attribute = {
                [Op.iLike]: `%${attribute}%`
            };
        }

        if (card_type) {
            cardWhere.card_type = {
                [Op.iLike]: `%${card_type}%`
            };
        }

        const selectedArchetypeId = Number(archetypeId);

        const excludeCardsWithOtherArchetypes = sequelize.literal(`(
            EXISTS (
                SELECT 1
                FROM banlist_archetype_card bac
                WHERE bac.card_id = "Card"."id"
                AND (
                    bac.archetype_id = ${selectedArchetypeId}
                    OR bac.archetype_id IS NULL
                    OR bac.archetype_id = 0
                )
            )
        )`);

        const whereConditions = [excludeCardsWithOtherArchetypes];
        // Object.keys ignore les Symboles (ex. Op.or du filtre nom) → utiliser aussi getOwnPropertySymbols
        const hasCardFilters =
            Object.keys(cardWhere).length > 0 ||
            Object.getOwnPropertySymbols(cardWhere).length > 0;
        const finalWhere = hasCardFilters
            ? { [Op.and]: [cardWhere, ...whereConditions] }
            : { [Op.and]: whereConditions };

        const result = await Card.findAndCountAll({
            where: finalWhere,
            include: [
                {
                    model: BanlistArchetypeCard,
                    as: 'banlist_archetype_cards',
                    required: false,
                    attributes: ['id', 'archetype_id', 'card_status_id'],
                    where: {
                        [Op.or]: [
                            { archetype_id: selectedArchetypeId },
                            { archetype_id: null },
                            { archetype_id: 0 },
                        ],
                    },
                    include: [
                        {
                            model: CardStatus,
                            as: 'card_status',
                            required: false,
                            attributes: ['id', 'label', 'limit']
                        }
                    ]
                }
            ],
            limit,
            offset,
            distinct: true,
            order: [['name', 'ASC']]
        });

        const formattedData = result.rows.map(card => {
            const cardData = card.toJSON() as Card & { banlist_archetype_cards?: Array<BanlistArchetypeCard & { card_status?: CardStatus }> };

            let banlistCard: (BanlistArchetypeCard & { card_status?: CardStatus }) | null = null;
            if (cardData.banlist_archetype_cards && cardData.banlist_archetype_cards.length > 0) {
                banlistCard = cardData.banlist_archetype_cards.find(bac => bac.archetype_id === selectedArchetypeId) || null;

                if (!banlistCard) {
                    banlistCard = cardData.banlist_archetype_cards.find(
                        (bac) => bac.archetype_id === null || bac.archetype_id === 0
                    ) || null;
                }
            }

            const cardStatusData = banlistCard && banlistCard.card_status
                ? banlistCard.card_status
                : null;

            return {
                ...cardData,
                card_status: cardStatusData
            } as Card & { card_status: CardStatus | null; id: string };
        });

        const localizedData = await CardService.applyLocaleToCardRecords(formattedData, locale);

        const totalPages = Math.ceil(result.count / limit);
        const hasNextPage = parseInt(String(page)) < totalPages;
        const hasPreviousPage = parseInt(String(page)) > 1;

        return {
            data: localizedData,
            pagination: {
                total: result.count,
                totalPages: totalPages,
                currentPage: parseInt(String(page)),
                pageSize: limit,
                hasNextPage: hasNextPage,
                hasPreviousPage: hasPreviousPage,
                nextPage: hasNextPage ? parseInt(String(page)) + 1 : null,
                previousPage: hasPreviousPage ? parseInt(String(page)) - 1 : null
            }
        };
    }

    static async addCards(cards: CardData[]): Promise<{
        results: Array<{ index: number; success: boolean; created: boolean; updated?: boolean; skipped?: boolean; banlistEntryCreated?: boolean; card: Card }>;
        errors: Array<{ index: number; cardId?: string; error: string }>;
    }> {
        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            throw new Error('Les données des cartes sont requises et doivent être un tableau non vide');
        }

        const results: Array<{ index: number; success: boolean; created: boolean; updated?: boolean; skipped?: boolean; banlistEntryCreated?: boolean; card: Card }> = [];
        const errors: Array<{ index: number; cardId?: string; error: string }> = [];

        for (let i = 0; i < cards.length; i++) {
            const cardData = cards[i];

            try {
                if (!cardData.id || !cardData.name) {
                    errors.push({
                        index: i,
                        error: 'ID et nom sont obligatoires pour chaque carte'
                    });
                    continue;
                }

                const cardId = String(cardData.id);

                const payload = {
                    name: cardData.name,
                    description: cardData.description ?? null,
                    img_url: cardData.img_url ?? null,
                    level: cardData.level ?? null,
                    atk: cardData.atk ?? null,
                    def: cardData.def ?? null,
                    attribute: cardData.attribute ?? null,
                    card_type: cardData.card_type ?? null
                };

                const existingCard = await Card.findByPk(cardId);
                if (existingCard) {
                    if (existingCard.manual_update) {
                        results.push({
                            index: i,
                            success: true,
                            created: false,
                            skipped: true,
                            card: existingCard
                        });
                    } else {
                        await existingCard.update(payload);
                        await CardService.upsertCardTranslations(cardId, cardData);
                        const banlistEntryCreated = await CardService.ensureDefaultBanlistEntryForNewCard(cardId);
                        results.push({
                            index: i,
                            success: true,
                            created: false,
                            updated: true,
                            banlistEntryCreated,
                            card: existingCard
                        });
                    }
                } else {
                    const newCard = await Card.create({
                        id: cardId,
                        ...payload
                    });

                    await CardService.upsertCardTranslations(cardId, cardData);
                    const banlistEntryCreated = await CardService.ensureDefaultBanlistEntryForNewCard(cardId);

                    results.push({
                        index: i,
                        success: true,
                        created: true,
                        banlistEntryCreated,
                        card: newCard
                    });
                }
            } catch (cardError) {
                const errorMessage = cardError instanceof Error ? cardError.message : 'Erreur inconnue';
                errors.push({
                    index: i,
                    cardId: cardData.id,
                    error: errorMessage
                });
            }
        }

        return { results, errors };
    }
}

export default CardService;
