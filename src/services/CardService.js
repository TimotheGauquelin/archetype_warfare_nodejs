import { Card, Archetype, Type, Attribute, SummonMechanic, BanlistArchetypeCard, CardStatus } from '../models/relations.js';
import { Op } from 'sequelize';
import sequelize from '../config/Sequelize.js';

class CardService {
    static async getAllCards() {
        return Card.findAll({
            include: [
                { model: Archetype },
                { model: Type },
                { model: Attribute },
                { model: SummonMechanic }
            ]
        });
    }

    static async searchCards(request, response, next) {
        try {
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
            } = request.query;

            const limit = parseInt(size);
            const offset = (parseInt(page) - 1) * limit;

            const where = {};

            // Recherche par nom
            if (name) {
                where.name = {
                    [Op.iLike]: `%${name}%`
                };
            }

            // Recherche par niveau
            if (level) {
                where.level = parseInt(level);
            }

            // Recherche par ATK (min et max)
            if (min_atk || max_atk) {
                where.atk = {};
                if (min_atk) {
                    where.atk[Op.gte] = parseInt(min_atk);
                }
                if (max_atk) {
                    where.atk[Op.lte] = parseInt(max_atk);
                }
            }

            // Recherche par DEF (min et max)
            if (min_def || max_def) {
                where.def = {};
                if (min_def) {
                    where.def[Op.gte] = parseInt(min_def);
                }
                if (max_def) {
                    where.def[Op.lte] = parseInt(max_def);
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
            const hasNextPage = parseInt(page) < totalPages;
            const hasPreviousPage = parseInt(page) > 1;

            return response.json({
                data: result.rows,
                pagination: {
                    total: result.count,
                    totalPages: totalPages,
                    currentPage: parseInt(page),
                    pageSize: limit,
                    hasNextPage: hasNextPage,
                    hasPreviousPage: hasPreviousPage,
                    nextPage: hasNextPage ? parseInt(page) + 1 : null,
                    previousPage: hasPreviousPage ? parseInt(page) - 1 : null
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async searchCardsByArchetypeBanlist(request, response, next) {
        try {
            const { archetypeId } = request.params;
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
            } = request.query;

            const limit = parseInt(size);
            const offset = (parseInt(page) - 1) * limit;

            const cardWhere = {};

            if (name) {
                cardWhere.name = {
                    [Op.iLike]: `%${name}%`
                };
            }

            if (level) {
                cardWhere.level = parseInt(level);
            }

            if (min_atk || max_atk) {
                cardWhere.atk = {};
                if (min_atk) {
                    cardWhere.atk[Op.gte] = parseInt(min_atk);
                }
                if (max_atk) {
                    cardWhere.atk[Op.lte] = parseInt(max_atk);
                }
            }

            if (min_def || max_def) {
                cardWhere.def = {};
                if (min_def) {
                    cardWhere.def[Op.gte] = parseInt(min_def);
                }
                if (max_def) {
                    cardWhere.def[Op.lte] = parseInt(max_def);
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
                    AND bac.archetype_id != ${parseInt(archetypeId)}
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
                        required: false, // LEFT JOIN - inclut même les cartes sans BanlistArchetypeCard
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

            // Transformation des données pour le format de retour souhaité
            const formattedData = result.rows.map(card => {
                const cardData = card.toJSON();

                // Récupérer le BanlistArchetypeCard approprié pour obtenir le card_status
                // Priorité : 1) celui avec archetype_id = archetypeId, 2) celui avec archetype_id = null, 3) le premier
                let banlistCard = null;
                if (cardData.banlist_archetype_cards && cardData.banlist_archetype_cards.length > 0) {
                    // Chercher d'abord celui avec archetype_id = archetypeId
                    banlistCard = cardData.banlist_archetype_cards.find(bac => bac.archetype_id === parseInt(archetypeId));

                    // Sinon, chercher celui avec archetype_id = null
                    if (!banlistCard) {
                        banlistCard = cardData.banlist_archetype_cards.find(bac => bac.archetype_id === null);
                    }

                    // Sinon, prendre le premier
                    if (!banlistCard) {
                        banlistCard = cardData.banlist_archetype_cards[0];
                    }
                }

                const cardStatusData = banlistCard && banlistCard.card_status
                    ? banlistCard.card_status
                    : null;

                return {
                    id: cardData.id,
                    name: cardData.name,
                    description: cardData.description,
                    img_url: cardData.img_url,
                    level: cardData.level,
                    atk: cardData.atk,
                    def: cardData.def,
                    attribute: cardData.attribute,
                    card_type: cardData.card_type,
                    card_status: cardStatusData ? {
                        id: cardStatusData.id,
                        label: cardStatusData.label,
                        limit: cardStatusData.limit
                    } : null
                };
            });

            const totalPages = Math.ceil(result.count / limit);
            const hasNextPage = parseInt(page) < totalPages;
            const hasPreviousPage = parseInt(page) > 1;

            return response.json({
                data: formattedData,
                pagination: {
                    total: result.count,
                    totalPages: totalPages,
                    currentPage: parseInt(page),
                    pageSize: limit,
                    hasNextPage: hasNextPage,
                    hasPreviousPage: hasPreviousPage,
                    nextPage: hasNextPage ? parseInt(page) + 1 : null,
                    previousPage: hasPreviousPage ? parseInt(page) - 1 : null
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async addCards(request, response, next) {
        try {
            const cards = request.body;

            if (!cards || !Array.isArray(cards) || cards.length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Les données des cartes sont requises et doivent être un tableau non vide'
                });
            }

            const results = [];
            const errors = [];

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

                    const existingCard = await Card.findByPk(cardId);
                    if (existingCard) {
                        errors.push({
                            index: i,
                            cardId: cardData.id,
                            error: 'Une carte avec cet ID existe déjà'
                        });
                        continue;
                    }

                    const cardToCreate = {
                        id: cardId, // Utiliser l'ID converti
                        name: cardData.name,
                        description: cardData.description || null,
                        img_url: cardData.img_url || null,
                        level: cardData.level || 0,
                        atk: cardData.atk || 0,
                        def: cardData.def || 0,
                        attribute: cardData.attribute || null,
                        card_type: cardData.card_type || null
                    };

                    const newCard = await Card.create(cardToCreate);
                    results.push({
                        index: i,
                        success: true,
                        card: newCard
                    });

                } catch (cardError) {
                    errors.push({
                        index: i,
                        cardId: cardData.id,
                        error: cardError.message
                    });
                }
            }

            // Préparation de la réponse
            const responseData = {
                success: true,
                message: `Traitement terminé. ${results.length} carte(s) ajoutée(s), ${errors.length} erreur(s)`,
                results: results,
                errors: errors
            };

            // Si toutes les cartes ont échoué, retourner une erreur 400
            if (results.length === 0 && errors.length > 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Aucune carte n\'a pu être ajoutée',
                    errors: errors
                });
            }

            // Si toutes les cartes ont réussi, retourner 201
            if (errors.length === 0) {
                return response.status(201).json(responseData);
            }

            // Si certaines cartes ont réussi et d'autres échoué, retourner 207 (Multi-Status)
            return response.status(207).json(responseData);

        } catch (error) {
            next(error);
        }
    }
}

export default CardService; 