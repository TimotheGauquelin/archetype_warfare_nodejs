import { Deck, DeckCard, Card, Archetype } from '../models/relations';
import { CustomError } from '../errors/CustomError';
import sequelize from '../config/Sequelize';

interface DeckCardData {
    card?: { id: string };
    card_id?: string;
    quantity: number;
}

interface CreateDeckData {
    label: string;
    comment?: string;
    archetype_id?: number | null;
    deck_cards?: DeckCardData[];
}

interface UpdateDeckData {
    label?: string;
    comment?: string;
    archetype_id?: number | null;
    deck_cards?: DeckCardData[];
}

class DeckService {
    static async getAllDecksByUserId(userId: string, isPlayable?: boolean | null, isArchetypeActive?: boolean | null): Promise<Deck[]> {
        const where: { user_id: string; is_playable?: boolean; '$archetype.is_active$'?: boolean } = { user_id: userId };
        if (isPlayable !== undefined && isPlayable !== null) {
            where.is_playable = isPlayable;
        }
        if (isArchetypeActive !== undefined && isArchetypeActive !== null) {
            where['$archetype.is_active$'] = isArchetypeActive;
        }

        return Deck.findAll({
            where,
            include: [
                {
                    model: Archetype,
                    as: 'archetype',
                    attributes: ['id', 'name', 'card_img_url', 'is_active'],
                    required: false
                },
                {
                    model: DeckCard,
                    as: 'deck_cards',
                    attributes: ['deck_id', 'card_id', 'quantity'],
                    include: [
                        {
                            model: Card,
                            as: 'card'
                        }
                    ]
                }
            ]
        });
    }

    static async getDeckById(id: string): Promise<Deck | null> {
        return Deck.findByPk(id, {
            include: [
                {
                    model: DeckCard,
                    as: 'deck_cards',
                    attributes: ['deck_id', 'card_id', 'quantity'],
                    include: [
                        {
                            model: Card,
                            as: 'card'
                        }
                    ]
                },
                {
                    model: Archetype,
                    as: 'archetype',
                    attributes: ['id', 'name', 'is_active'],
                    required: false
                }
            ]
        });
    }

    static async createDeck(body: CreateDeckData, userId: string): Promise<void> {
        const transaction = await sequelize.transaction();

        try {
            const deck = await Deck.create({
                label: body.label.trim(),
                comment: body.comment || '',
                archetype_id: body.archetype_id || null,
                user_id: userId
            }, { transaction });

            const deckId = deck.id;

            let mainDeckCardCount = 0;
            if (body.deck_cards && Array.isArray(body.deck_cards) && body.deck_cards.length > 0) {
                const cardMap = new Map<string, number>();

                for (const deckCard of body.deck_cards) {
                    let cardId: string;
                    if (deckCard.card && deckCard.card.id) {
                        cardId = deckCard.card.id;
                    } else if (deckCard.card_id) {
                        cardId = deckCard.card_id;
                    } else {
                        throw new CustomError('Chaque carte doit avoir un card_id ou un objet card avec un id', 400);
                    }

                    const quantity = deckCard.quantity;
                    if (!quantity || typeof quantity !== 'number') {
                        throw new CustomError('Chaque carte doit avoir une quantité valide', 400);
                    }

                    if (quantity <= 0) {
                        throw new CustomError('Vous ne pouvez pas ajouter une carte en zéro exemplaire dans un deck', 400);
                    }

                    if (quantity > 3) {
                        throw new CustomError('Vous ne pouvez pas ajouter plus de 3 exemplaires de la même carte dans un deck', 400);
                    }

                    if (cardMap.has(cardId)) {
                        const totalQuantity = cardMap.get(cardId)! + quantity;
                        if (totalQuantity > 3) {
                            throw new CustomError(`La carte ${cardId} dépasse la limite de 3 exemplaires au total`, 400);
                        }
                        cardMap.set(cardId, totalQuantity);
                    } else {
                        cardMap.set(cardId, quantity);
                    }
                }

                const cardIds = Array.from(cardMap.keys());
                const existingCards = await Card.findAll({
                    where: {
                        id: cardIds
                    },
                    attributes: ['id', 'card_type'],
                    transaction
                });

                const existingCardIds = new Set(existingCards.map(card => card.id));
                const missingCardIds = cardIds.filter(id => !existingCardIds.has(id));

                if (missingCardIds.length > 0) {
                    throw new CustomError(`Les cartes suivantes n'existent pas: ${missingCardIds.join(', ')}`, 404);
                }

                // Compte uniquement les cartes de main deck (exclut Fusion, Synchro, Link, XYZ)
                for (const card of existingCards) {
                    const type = (card as any).card_type || '';
                    const lower = type.toLowerCase();
                    const isExtraDeckType =
                        lower.includes('fusion') ||
                        lower.includes('synchro') ||
                        lower.includes('link') ||
                        lower.includes('xyz');
                    if (!isExtraDeckType) {
                        const qty = cardMap.get(card.id);
                        if (qty) {
                            mainDeckCardCount += qty;
                        }
                    }
                }

                for (const [cardId, quantity] of cardMap.entries()) {
                    await DeckCard.create({
                        deck_id: deckId,
                        card_id: cardId,
                        quantity: quantity
                    }, { transaction });
                }
            }

            const is_playable = mainDeckCardCount >= 40 && mainDeckCardCount <= 60;
            await deck.update({ is_playable }, { transaction });

            console.log('deck.archetype_id', deck.archetype_id);
            if (deck.archetype_id != null) {
                await Archetype.increment(
                    { popularity_poll: 5 },
                    {
                        where: { id: deck.archetype_id },
                        transaction
                    }
                );
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateMyDeck(id: string, body: UpdateDeckData, existingDeck: Deck): Promise<Deck> {
        const { label, comment, archetype_id, deck_cards } = body;
        const transaction = await sequelize.transaction();

        try {
            await Deck.update({
                label: label ? label.trim() : existingDeck.label,
                comment: comment !== undefined ? comment : existingDeck.comment,
                archetype_id: archetype_id !== undefined ? archetype_id : existingDeck.archetype_id,
            }, {
                where: { id: id },
                transaction
            });

            if (deck_cards !== undefined && Array.isArray(deck_cards)) {
                const existingDeckCards = await DeckCard.findAll({
                    where: { deck_id: id },
                    transaction
                });

                const existingCardMap = new Map<string, DeckCard>();
                existingDeckCards.forEach(deckCard => {
                    existingCardMap.set(deckCard.card_id, deckCard);
                });

                const newCardMap = new Map<string, number>();
                let mainDeckCardCount = 0;

                if (deck_cards.length > 0) {
                    for (const deckCard of deck_cards) {
                        let cardId: string;
                        if (deckCard.card && deckCard.card.id) {
                            cardId = deckCard.card.id;
                        } else if (deckCard.card_id) {
                            cardId = deckCard.card_id;
                        } else {
                            throw new CustomError('Chaque carte doit avoir un card_id ou un objet card avec un id', 400);
                        }

                        const quantity = deckCard.quantity;
                        if (!quantity || typeof quantity !== 'number') {
                            throw new CustomError('Chaque carte doit avoir une quantité valide', 400);
                        }

                        if (quantity <= 0) {
                            throw new CustomError('Vous ne pouvez pas ajouter une carte en zéro exemplaire dans un deck', 400);
                        }

                        if (quantity > 3) {
                            throw new CustomError('Vous ne pouvez pas ajouter plus de 3 exemplaires de la même carte dans un deck', 400);
                        }

                        if (newCardMap.has(cardId)) {
                            const totalQuantity = newCardMap.get(cardId)! + quantity;
                            if (totalQuantity > 3) {
                                throw new CustomError(`La carte ${cardId} dépasse la limite de 3 exemplaires au total`, 400);
                            }
                            newCardMap.set(cardId, totalQuantity);
                        } else {
                            newCardMap.set(cardId, quantity);
                        }
                    }
                }

                if (newCardMap.size > 0) {
                    const cardIds = Array.from(newCardMap.keys());
                    const existingCards = await Card.findAll({
                        where: {
                            id: cardIds
                        },
                        attributes: ['id', 'card_type'],
                        transaction
                    });

                    const existingCardIds = new Set(existingCards.map(card => card.id));
                    const missingCardIds = cardIds.filter(id => !existingCardIds.has(id));

                    if (missingCardIds.length > 0) {
                        throw new CustomError(`Les cartes suivantes n'existent pas: ${missingCardIds.join(', ')}`, 404);
                    }

                    // Compte uniquement les cartes de main deck (exclut Fusion, Synchro, Link, XYZ)
                    for (const card of existingCards) {
                        const type = (card as any).card_type || '';
                        const lower = type.toLowerCase();
                        const isExtraDeckType =
                            lower.includes('fusion') ||
                            lower.includes('synchro') ||
                            lower.includes('link') ||
                            lower.includes('xyz');
                        if (!isExtraDeckType) {
                            const qty = newCardMap.get(card.id);
                            if (qty) {
                                mainDeckCardCount += qty;
                            }
                        }
                    }
                }

                const cardsToDelete: string[] = [];
                existingCardMap.forEach((_deckCard, cardId) => {
                    if (!newCardMap.has(cardId)) {
                        cardsToDelete.push(cardId);
                    }
                });

                if (cardsToDelete.length > 0) {
                    await DeckCard.destroy({
                        where: {
                            deck_id: id,
                            card_id: cardsToDelete
                        },
                        transaction
                    });
                }

                for (const [cardId, quantity] of newCardMap.entries()) {
                    if (existingCardMap.has(cardId)) {
                        const existingDeckCard = existingCardMap.get(cardId)!;
                        if (existingDeckCard.quantity !== quantity) {
                            await DeckCard.update(
                                { quantity: quantity },
                                {
                                    where: {
                                        deck_id: id,
                                        card_id: cardId
                                    },
                                    transaction
                                }
                            );
                        }
                    } else {
                        await DeckCard.create({
                            deck_id: id,
                            card_id: cardId,
                            quantity: quantity
                        }, { transaction });
                    }
                }
                const is_playable = mainDeckCardCount >= 40 && mainDeckCardCount <= 60;
                await Deck.update({ is_playable }, { where: { id }, transaction });
            }

            await transaction.commit();

            const updatedDeck = await Deck.findByPk(id, {
                include: [
                    {
                        model: DeckCard,
                        as: 'deck_cards',
                        attributes: ['deck_id', 'card_id', 'quantity'],
                        include: [
                            {
                                model: Card,
                                as: 'card'
                            }
                        ]
                    }
                ]
            });

            if (!updatedDeck) {
                throw new CustomError('Deck non trouvé après mise à jour', 404);
            }

            return updatedDeck;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async deleteMyDeck(id: string): Promise<number> {
        const transaction = await sequelize.transaction();
        try {
            const deck = await Deck.findByPk(id, { transaction });

            if (!deck) {
                await transaction.rollback();
                return 0;
            }

            const archetypeId = deck.archetype_id;

            const deletedCount = await Deck.destroy({
                where: { id },
                transaction
            });

            // Popularité de l'archetype : -5 points à la suppression d'un deck associé
            if (deletedCount > 0 && archetypeId != null) {
                await Archetype.increment(
                    { popularity_poll: -5 },
                    {
                        where: { id: archetypeId },
                        transaction
                    }
                );
            }

            await transaction.commit();
            return deletedCount;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

export default DeckService;
