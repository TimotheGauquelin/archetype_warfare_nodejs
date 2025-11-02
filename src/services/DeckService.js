import { Deck, DeckCard, Card, User, Archetype } from '../models/relations.js';
import { CustomError } from '../errors/CustomError.js';
import sequelize from '../config/Sequelize.js';

class DeckService {

    static async getAllDecksByUserId(userId) {
        return await Deck.findAll({
            where: { user_id: userId },
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
    }

    static async getDeckById(id) {
        return await Deck.findByPk(id, {
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
    }

    static async createDeck(body, userId) {
        const transaction = await sequelize.transaction();

        try {
            const deck = await Deck.create({
                label: body.label.trim(),
                comment: body.comment || '',
                archetype_id: body.archetype_id || null,
                user_id: userId
            }, { transaction });

            const deckId = deck.dataValues.id;

            if (body.deck_cards && Array.isArray(body.deck_cards) && body.deck_cards.length > 0) {
                const cardMap = new Map();

                for (const deckCard of body.deck_cards) {
                    // Extraire card_id selon le format reçu
                    // Format 1: { card: { id: '...' }, quantity: 3 }
                    // Format 2: { card_id: '...', quantity: 3 } (ancien format pour compatibilité)
                    let cardId;
                    if (deckCard.card && deckCard.card.id) {
                        cardId = deckCard.card.id;
                    } else if (deckCard.card_id) {
                        cardId = deckCard.card_id;
                    } else {
                        throw new CustomError('Chaque carte doit avoir un card_id ou un objet card avec un id', 400);
                    }

                    // Validation de la quantité
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

                    // Regrouper les quantités si la même carte est ajoutée plusieurs fois
                    if (cardMap.has(cardId)) {
                        const totalQuantity = cardMap.get(cardId) + quantity;
                        if (totalQuantity > 3) {
                            throw new CustomError(`La carte ${cardId} dépasse la limite de 3 exemplaires au total`, 400);
                        }
                        cardMap.set(cardId, totalQuantity);
                    } else {
                        cardMap.set(cardId, quantity);
                    }
                }

                // Vérifier que les cartes existent dans la base de données
                const cardIds = Array.from(cardMap.keys());
                const existingCards = await Card.findAll({
                    where: {
                        id: cardIds
                    },
                    attributes: ['id'],
                    transaction
                });

                const existingCardIds = new Set(existingCards.map(card => card.id));
                const missingCardIds = cardIds.filter(id => !existingCardIds.has(id));

                if (missingCardIds.length > 0) {
                    throw new CustomError(`Les cartes suivantes n'existent pas: ${missingCardIds.join(', ')}`, 404);
                }

                // Créer les DeckCard
                for (const [cardId, quantity] of cardMap.entries()) {
                    await DeckCard.create({
                        deck_id: deckId,
                        card_id: cardId,
                        quantity: quantity
                    }, { transaction });
                }
            }

            await transaction.commit();

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateMyDeck(request) {
        const { label, comment, archetype_id, deck_cards } = request.body;
        const { id } = request.params;
        const transaction = await sequelize.transaction();

        try {
            // Vérifier que le deck existe
            const deck = await Deck.findByPk(id);
            if (!deck) {
                throw new CustomError('Deck non trouvé', 404);
            }

            // Mettre à jour les informations du deck
            await Deck.update({
                label: label ? label.trim() : deck.label,
                comment: comment !== undefined ? comment : deck.comment,
                archetype_id: archetype_id !== undefined ? archetype_id : deck.archetype_id,
            }, {
                where: { id: id },
                transaction
            });

            // Gérer les deck_cards si fournies
            if (deck_cards !== undefined && Array.isArray(deck_cards)) {
                // Récupérer les cartes actuelles du deck
                const existingDeckCards = await DeckCard.findAll({
                    where: { deck_id: id },
                    transaction
                });

                // Créer un Map des cartes existantes : card_id -> DeckCard
                const existingCardMap = new Map();
                existingDeckCards.forEach(deckCard => {
                    existingCardMap.set(deckCard.card_id, deckCard);
                });

                // Créer un Map des nouvelles cartes : card_id -> quantity
                const newCardMap = new Map();

                if (deck_cards.length > 0) {
                    for (const deckCard of deck_cards) {
                        // Extraire card_id selon le format reçu
                        let cardId;
                        if (deckCard.card && deckCard.card.id) {
                            cardId = deckCard.card.id;
                        } else if (deckCard.card_id) {
                            cardId = deckCard.card_id;
                        } else {
                            throw new CustomError('Chaque carte doit avoir un card_id ou un objet card avec un id', 400);
                        }

                        // Validation de la quantité
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

                        // Regrouper les quantités si la même carte est ajoutée plusieurs fois
                        if (newCardMap.has(cardId)) {
                            const totalQuantity = newCardMap.get(cardId) + quantity;
                            if (totalQuantity > 3) {
                                throw new CustomError(`La carte ${cardId} dépasse la limite de 3 exemplaires au total`, 400);
                            }
                            newCardMap.set(cardId, totalQuantity);
                        } else {
                            newCardMap.set(cardId, quantity);
                        }
                    }
                }

                // Vérifier que les nouvelles cartes existent dans la base de données
                if (newCardMap.size > 0) {
                    const cardIds = Array.from(newCardMap.keys());
                    const existingCards = await Card.findAll({
                        where: {
                            id: cardIds
                        },
                        attributes: ['id'],
                        transaction
                    });

                    const existingCardIds = new Set(existingCards.map(card => card.id));
                    const missingCardIds = cardIds.filter(id => !existingCardIds.has(id));

                    if (missingCardIds.length > 0) {
                        throw new CustomError(`Les cartes suivantes n'existent pas: ${missingCardIds.join(', ')}`, 404);
                    }
                }

                // Supprimer les cartes qui ne sont plus dans le nouveau tableau
                const cardsToDelete = [];
                existingCardMap.forEach((deckCard, cardId) => {
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

                // Traiter les cartes : créer, mettre à jour ou laisser telles quelles
                for (const [cardId, quantity] of newCardMap.entries()) {
                    if (existingCardMap.has(cardId)) {
                        // La carte existe déjà, mettre à jour la quantité si elle a changé
                        const existingDeckCard = existingCardMap.get(cardId);
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
                        // Nouvelle carte, la créer
                        await DeckCard.create({
                            deck_id: id,
                            card_id: cardId,
                            quantity: quantity
                        }, { transaction });
                    }
                }
            }

            await transaction.commit();

            // Retourner le deck mis à jour avec ses cartes
            return await Deck.findByPk(id, {
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
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async deleteDeck(id) {
        return Deck.destroy({
            where: { id }
        });
    }
}

export default DeckService; 