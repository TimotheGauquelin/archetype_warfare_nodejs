import { Banlist, BanlistArchetypeCard, Archetype, Card, CardStatus } from '../models/relations';
import sequelize from '../config/Sequelize';
import { Op } from 'sequelize';

interface BanlistArchetypeCardData {
    card_id: string;
    card_status_id: number;
    explanation_text?: string | null;
    archetype_id?: number | null;
    id?: number;
}

interface BanlistData {
    label: string;
    release_date: Date;
    description: string;
    is_active: boolean;
    is_event_banlist?: boolean;
    banlist_archetype_cards?: BanlistArchetypeCardData[];
}

class BanlistService {
    static async getAllBanlists(): Promise<Banlist[]> {
        return Banlist.findAll();
    }

    static async getBanlistById(id: number): Promise<Banlist | null> {
        return Banlist.findOne({
            where: { id },
            include: [
                {
                    model: BanlistArchetypeCard,
                    as: 'banlist_archetype_cards',
                    // where: {
                    //     archetype_id: null
                    // },
                    include: [
                        {
                            model: Card,
                            as: 'card',
                            attributes: ['id', 'name', 'img_url']
                        },
                        {
                            model: CardStatus,
                            as: 'card_status'
                        }
                    ]
                }]
        });
    }

    static async getCurrentBanlist(includeArchetypeCards: boolean = true): Promise<Banlist | null> {
        const today = new Date();

        const includeArchetypeCardsCondition = includeArchetypeCards ? {} : { archetype_id: null };

        let standardBanlist = await Banlist.findOne({
            order: [['release_date', 'DESC']],
            where: {
                is_active: true,
                is_event_banlist: false,
                release_date: {
                    [Op.lte]: today
                }
            },
            include: [
                {
                    model: BanlistArchetypeCard,
                    as: 'banlist_archetype_cards',
                    where: includeArchetypeCardsCondition,
                    required: false,
                    include: [
                        {
                            model: Card,
                            as: 'card',
                            attributes: ['id', 'name', 'img_url']
                        },
                        {
                            model: CardStatus,
                            as: 'card_status',
                            attributes: ['id', 'label']
                        }
                    ]
                }
            ]
        });

        return standardBanlist;

        // if (!standardBanlist) {
        //     standardBanlist = await Banlist.findOne({
        //         order: [['release_date', 'ASC']],
        //         where: {
        //             is_active: true,
        //             is_event_banlist: false,
        //             release_date: {
        //                 [Op.gte]: today
        //             }
        //         }
        //     });
        // }

        // const eventBanlists = await Banlist.findAll({
        //     order: [['release_date', 'DESC']],
        //     where: {
        //         is_active: true,
        //         is_event_banlist: true,
        //         release_date: {
        //             [Op.lte]: today
        //         }
        //     }
        // });
    }

    static async addBanlist(banlistData: BanlistData): Promise<void> {
        const transaction = await sequelize.transaction();
        try {
            const { banlist_archetype_cards, label, release_date, description, is_active, is_event_banlist } = banlistData;

            const banlist = await Banlist.create(
                {
                    label: label,
                    release_date: release_date,
                    description: description,
                    is_active: is_active,
                    is_event_banlist: is_event_banlist ?? false
                },
                { transaction }
            );

            if (banlist_archetype_cards && Array.isArray(banlist_archetype_cards) && banlist_archetype_cards.length > 0) {
                for (const card of banlist_archetype_cards) {
                    await BanlistArchetypeCard.create({
                        banlist_id: banlist.id,
                        card_id: card.card_id,
                        card_status_id: card.card_status_id,
                        explanation_text: card.explanation_text || null,
                        archetype_id: card.archetype_id || null
                    }, { transaction });
                }
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateBanlist(banlistId: number, databaseBanlist: Banlist, banlistData: BanlistData): Promise<void> {
        const { banlist_archetype_cards, ...banlistFields } = banlistData;

        await databaseBanlist.update(banlistFields);

        if (!banlist_archetype_cards || banlist_archetype_cards.length === 0) {
            return;
        }

        const existingCardsInBanlist = await BanlistArchetypeCard.findAll({
            where: {
                banlist_id: banlistId,
                archetype_id: null
            },
            attributes: ['id', 'card_id', 'card_status_id', 'explanation_text']
        });

        const existingCardMap = new Map<string, BanlistArchetypeCard>(existingCardsInBanlist.map(card => [card.card_id as string, card]));
        const frontendCardMap = new Map<string, BanlistArchetypeCardData>(banlist_archetype_cards.map(card => [card.card_id, card]));

        const cardsToDeleteIds: number[] = [];
        const cardsToAdd: Array<BanlistArchetypeCardData & { banlist_id: number }> = [];
        const cardsToUpdate: Array<{ id: number; card_status_id: number; explanation_text: string | null }> = [];

        for (const [cardId, existingCard] of existingCardMap) {
            if (!frontendCardMap.has(cardId)) {
                cardsToDeleteIds.push(existingCard.id);
            }
        }

        for (const [cardId, cardData] of frontendCardMap) {
            if (!existingCardMap.has(cardId)) {
                cardsToAdd.push({
                    ...cardData,
                    banlist_id: banlistId
                });
            } else {
                const existingCard = existingCardMap.get(cardId);
                if (existingCard && (existingCard.card_status_id !== cardData.card_status_id ||
                    existingCard.explanation_text !== cardData.explanation_text)) {
                    cardsToUpdate.push({
                        id: existingCard.id,
                        card_status_id: cardData.card_status_id,
                        explanation_text: cardData.explanation_text || null
                    });
                }
            }
        }

        if (cardsToAdd.length > 0) {
            const cardIds = [...new Set(cardsToAdd.map(card => card.card_id).filter(Boolean))];
            const cardStatusIds = [...new Set(cardsToAdd.map(card => card.card_status_id).filter(Boolean))];
            const archetypeIds = [...new Set(cardsToAdd.map(card => card.archetype_id).filter(Boolean))];

            const validationPromises: Promise<void>[] = [];

            if (cardIds.length > 0) {
                validationPromises.push(
                    Card.findAll({
                        where: { id: cardIds },
                        attributes: ['id']
                    }).then(existingCards => {
                        const existingCardIds = existingCards.map(card => card.id);
                        const missingCardIds = cardIds.filter(id => !existingCardIds.includes(id));
                        if (missingCardIds.length > 0) {
                            throw new Error(`Les cartes suivantes n'existent pas: ${missingCardIds.join(', ')}`);
                        }
                    })
                );
            }

            if (cardStatusIds.length > 0) {
                validationPromises.push(
                    CardStatus.findAll({
                        where: { id: cardStatusIds },
                        attributes: ['id']
                    }).then(existingCardStatuses => {
                        const existingCardStatusIds = existingCardStatuses.map(status => status.id);
                        const missingCardStatusIds = cardStatusIds.filter(id => !existingCardStatusIds.includes(id));
                        if (missingCardStatusIds.length > 0) {
                            throw new Error(`Les statuts de cartes suivants n'existent pas: ${missingCardStatusIds.join(', ')}`);
                        }
                    })
                );
            }

            if (archetypeIds.length > 0) {
                validationPromises.push(
                    Archetype.findAll({
                        where: { id: archetypeIds.filter((id): id is number => id != null) },
                        attributes: ['id']
                    }).then(existingArchetypes => {
                        const existingArchetypeIds = existingArchetypes.map(archetype => archetype.id);
                        const missingArchetypeIds = archetypeIds.filter(id => id != null && !existingArchetypeIds.includes(id));
                        if (missingArchetypeIds.length > 0) {
                            throw new Error(`Les archétypes suivants n'existent pas: ${missingArchetypeIds.join(', ')}`);
                        }
                    })
                );
            }

            await Promise.all(validationPromises);
        }

        const operations: Promise<unknown>[] = [];

        if (cardsToDeleteIds.length > 0) {
            operations.push(
                BanlistArchetypeCard.destroy({
                    where: { id: cardsToDeleteIds }
                })
            );
        }

        if (cardsToAdd.length > 0) {
            const cardsToAddWithoutId = cardsToAdd.map(card => {
                const { id, ...cardWithoutId } = card;
                return cardWithoutId;
            });

            operations.push(
                BanlistArchetypeCard.bulkCreate(cardsToAddWithoutId, {
                    ignoreDuplicates: false,
                    returning: true
                })
            );
        }

        if (cardsToUpdate.length > 0) {
            operations.push(
                Promise.all(cardsToUpdate.map(card =>
                    BanlistArchetypeCard.update(
                        {
                            card_status_id: card.card_status_id,
                            explanation_text: card.explanation_text
                        },
                        { where: { id: card.id } }
                    )
                ))
            );
        }

        await Promise.all(operations);
    }

    static async deleteBanlist(id: number): Promise<void> {
        await Banlist.destroy({
            where: { id }
        });
    }
}

export default BanlistService;
