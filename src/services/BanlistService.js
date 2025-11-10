import { Banlist, BanlistArchetypeCard, Archetype, Card, CardStatus } from '../models/relations.js';
import sequelize from '../config/Sequelize.js';

class BanlistService {
    static async getAllBanlists() {
        return Banlist.findAll({
            include: [{
                model: BanlistArchetypeCard,
                as: 'banlist_archetype_cards', // Utiliser l'alias défini dans relations.js
                include: [
                    {
                        model: Archetype,
                        as: 'archetype'
                    },
                    {
                        model: Card,
                        as: 'card'
                    },
                    {
                        model: CardStatus,
                        as: 'card_status'
                    }
                ]
            }]
        });
    }

    static async getBanlistById(id, next) {
        const banlist = await Banlist.findOne({
            where: { id },
            include: [{
                model: BanlistArchetypeCard,
                as: 'banlist_archetype_cards',
                where: {
                    archetype_id: null
                },
                include: [
                    {
                        model: Archetype,
                        as: 'archetype',
                    },
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
        console.log(banlist);
        return banlist;
    }

    static async getCurrentBanlist() {
        return Banlist.findOne({
            order: [['release_date', 'DESC']],
            include: [{
                model: BanlistArchetypeCard,
                as: 'banlist_archetype_cards',
                where: {
                    archetype_id: null
                },
                include: [
                    {
                        model: Archetype,
                        as: 'archetype'
                    },
                    {
                        model: Card,
                        as: 'card'
                    },
                    {
                        model: CardStatus,
                        as: 'card_status'
                    }
                ]
            }]
        });
    }

    static async addBanlist(banlistData) {
        const transaction = await sequelize.transaction();
        try {
            const { banlist_archetype_cards, label, release_date, description, is_active } = banlistData;

            const banlist = await Banlist.create(
                {
                    label: label,
                    release_date: release_date,
                    description: description,
                    is_active: is_active
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

    static async updateBanlist(banlistId, databaseBanlist, banlistData, next) {
        try {
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

            const existingCardMap = new Map(existingCardsInBanlist.map(card => [card.card_id, card]));
            const frontendCardMap = new Map(banlist_archetype_cards.map(card => [card.card_id, card]));

            const cardsToDeleteIds = [];
            const cardsToAdd = [];
            const cardsToUpdate = [];

            // Identifier les cartes à supprimer
            for (const [cardId, existingCard] of existingCardMap) {
                if (!frontendCardMap.has(cardId)) {
                    cardsToDeleteIds.push(existingCard.id);
                }
            }

            // Identifier les cartes à ajouter et à mettre à jour
            for (const [cardId, cardData] of frontendCardMap) {
                if (!existingCardMap.has(cardId)) {
                    // Nouvelle carte à ajouter
                    cardsToAdd.push({
                        ...cardData,
                        banlist_id: banlistId
                    });
                } else {
                    // Carte existante, vérifier si elle a besoin d'être mise à jour
                    const existingCard = existingCardMap.get(cardId);
                    if (existingCard.card_status_id !== cardData.card_status_id ||
                        existingCard.explanation_text !== cardData.explanation_text) {
                        cardsToUpdate.push({
                            id: existingCard.id,
                            card_status_id: cardData.card_status_id,
                            explanation_text: cardData.explanation_text
                        });
                    }
                }
            }

            if (cardsToAdd.length > 0) {
                const cardIds = [...new Set(cardsToAdd.map(card => card.card_id).filter(Boolean))];
                const cardStatusIds = [...new Set(cardsToAdd.map(card => card.card_status_id).filter(Boolean))];
                const archetypeIds = [...new Set(cardsToAdd.map(card => card.archetype_id).filter(Boolean))];

                const validationPromises = [];

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
                            where: { id: archetypeIds },
                            attributes: ['id']
                        }).then(existingArchetypes => {
                            const existingArchetypeIds = existingArchetypes.map(archetype => archetype.id);
                            const missingArchetypeIds = archetypeIds.filter(id => !existingArchetypeIds.includes(id));
                            if (missingArchetypeIds.length > 0) {
                                throw new Error(`Les archétypes suivants n'existent pas: ${missingArchetypeIds.join(', ')}`);
                            }
                        })
                    );
                }

                await Promise.all(validationPromises);
            }

            const operations = [];

            if (cardsToDeleteIds.length > 0) {
                operations.push(
                    BanlistArchetypeCard.destroy({
                        where: { id: cardsToDeleteIds }
                    })
                );
            }

            if (cardsToAdd.length > 0) {
                operations.push(
                    BanlistArchetypeCard.bulkCreate(cardsToAdd)
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

        } catch (error) {
            throw error;
        }
    }

    static async deleteBanlist(id, next) {
        try {
            await Banlist.destroy({
                where: { id }
            });
        } catch (error) {
            throw error;
        }
    }
}

export default BanlistService;


