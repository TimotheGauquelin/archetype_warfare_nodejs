import { Card, Archetype, Type, Attribute, SummonMechanic, BanlistArchetypeCard, CardStatus } from '../models/relations';
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
}

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
}

class CardService {
    /** Récupère une carte par son ID (détail). */
    static async getCardById(id: string): Promise<Card | null> {
        return Card.findByPk(id);
    }

    /**
     * Met à jour une carte (détails) et positionne manual_update à true.
     * À utiliser pour les modifications manuelles ; les imports POST ne pourront plus écraser cette carte.
     */
    static async updateCard(id: string, data: CardUpdateData): Promise<Card | null> {
        const card = await Card.findByPk(id);
        if (!card) return null;
        const updates: Record<string, unknown> = { manual_update: true };
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) updates[key] = value;
        }
        await card.update(updates);
        return card;
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
            size = 10
        } = filters;

        const limit = parseInt(String(size));
        const offset = (parseInt(String(page)) - 1) * limit;

        const where: WhereOptions = {};

        if (name) {
            where.name = {
                [Op.iLike]: `%${name}%`
            };
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

        const totalPages = Math.ceil(result.count / limit);
        const hasNextPage = parseInt(String(page)) < totalPages;
        const hasPreviousPage = parseInt(String(page)) > 1;

        return {
            data: result.rows,
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
            size = 10
        } = filters;

        const limit = parseInt(String(size));
        const offset = (parseInt(String(page)) - 1) * limit;

        const cardWhere: WhereOptions = {};

        if (name) {
            cardWhere.name = {
                [Op.iLike]: `%${name}%`
            };
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

        const excludeCardsWithOtherArchetypes = sequelize.literal(`(
            NOT EXISTS (
                SELECT 1 
                FROM banlist_archetype_card bac 
                WHERE bac.card_id = "Card"."id" 
                AND bac.archetype_id IS NOT NULL 
                AND bac.archetype_id != ${archetypeId}
            )
        )`);

        const whereConditions = [excludeCardsWithOtherArchetypes];
        const finalWhere = Object.keys(cardWhere).length > 0
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
                banlistCard = cardData.banlist_archetype_cards.find(bac => bac.archetype_id === archetypeId) || null;

                if (!banlistCard) {
                    banlistCard = cardData.banlist_archetype_cards.find(bac => bac.archetype_id === null) || null;
                }

                if (!banlistCard) {
                    banlistCard = cardData.banlist_archetype_cards[0];
                }
            }

            const cardStatusData = banlistCard && banlistCard.card_status
                ? banlistCard.card_status
                : null;

            return {
                ...cardData,
                card_status: cardStatusData
            } as Card & { card_status: CardStatus | null };
        });

        const totalPages = Math.ceil(result.count / limit);
        const hasNextPage = parseInt(String(page)) < totalPages;
        const hasPreviousPage = parseInt(String(page)) > 1;

        return {
            data: formattedData,
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
        results: Array<{ index: number; success: boolean; created: boolean; updated?: boolean; skipped?: boolean; card: Card }>;
        errors: Array<{ index: number; cardId?: string; error: string }>;
    }> {
        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            throw new Error('Les données des cartes sont requises et doivent être un tableau non vide');
        }

        const results: Array<{ index: number; success: boolean; created: boolean; updated?: boolean; skipped?: boolean; card: Card }> = [];
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
                        results.push({
                            index: i,
                            success: true,
                            created: false,
                            updated: true,
                            card: existingCard
                        });
                    }
                } else {
                    const newCard = await Card.create({
                        id: cardId,
                        ...payload
                    });
                    results.push({
                        index: i,
                        success: true,
                        created: true,
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
