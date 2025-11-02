import { Op } from 'sequelize';
import { Archetype, Era, Type, Attribute, SummonMechanic, Card, Banlist, CardStatus, BanlistArchetypeCard } from '../models/relations.js';
import { CustomError } from '../errors/CustomError.js';
import sequelize from '../config/Sequelize.js';
import UploadImageService from './UploadImageService.js';
import { extractImageIdFromUrl } from '../utils/image.js';

class ArchetypeService {
    static async searchArchetypes(request, response, next) {
        try {
            const { name, era, type, attribute, summonmechanic, page = 1, size = 10 } = request.query;

            const limit = parseInt(size);
            const offset = (parseInt(page) - 1) * limit;

            const where = {};

            if (name) {
                where.name = {
                    [Op.iLike]: `%${name}%`
                };
            }

            if (era) {
                where.era_id = era;
            }

            const include = [
                {
                    model: Era,
                    as: 'era',
                    attributes: ['id', 'label']
                },
                // Inclure les types
                {
                    model: Type,
                    as: 'types',
                    through: { attributes: [] },
                    attributes: ['id', 'label']
                },
                // Inclure les attributs
                {
                    model: Attribute,
                    as: 'attributes',
                    through: { attributes: [] },
                    attributes: ['id', 'label']
                },
                // Inclure les méthodes d'invocation
                {
                    model: SummonMechanic,
                    as: 'summon_mechanics',
                    through: { attributes: [] },
                    attributes: ['id', 'label']
                },
                {
                    model: BanlistArchetypeCard,
                    as: 'cards',
                    include: [
                        {
                            model: Card,
                            as: 'card',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ];

            // Créer des conditions séparées pour les filtres de relations
            let archetypeIds = null;

            // Si on filtre par type, on récupère d'abord les IDs des archétypes
            if (type) {
                const archetypesWithType = await Archetype.findAll({
                    include: [{
                        model: Type,
                        as: 'types',
                        where: {
                            label: {
                                [Op.iLike]: `%${type}%`
                            }
                        },
                        through: { attributes: [] }
                    }],
                    attributes: ['id']
                });
                archetypeIds = archetypesWithType.map(a => a.id);
            }

            // Si on filtre par attribut
            if (attribute) {
                const archetypesWithAttribute = await Archetype.findAll({
                    include: [{
                        model: Attribute,
                        as: 'attributes',
                        where: {
                            label: {
                                [Op.iLike]: `%${attribute}%`
                            }
                        },
                        through: { attributes: [] }
                    }],
                    attributes: ['id']
                });
                const attributeIds = archetypesWithAttribute.map(a => a.id);
                archetypeIds = archetypeIds ? archetypeIds.filter(id => attributeIds.includes(id)) : attributeIds;
            }

            // Si on filtre par méthode d'invocation
            if (summonmechanic) {
                const archetypesWithSummonMechanic = await Archetype.findAll({
                    include: [{
                        model: SummonMechanic,
                        as: 'summon_mechanics',
                        where: {
                            label: {
                                [Op.iLike]: `%${summonmechanic}%`
                            }
                        },
                        through: { attributes: [] }
                    }],
                    attributes: ['id']
                });
                const summonMechanicIds = archetypesWithSummonMechanic.map(a => a.id);
                archetypeIds = archetypeIds ? archetypeIds.filter(id => summonMechanicIds.includes(id)) : summonMechanicIds;
            }

            // Ajouter le filtre sur les IDs si nécessaire
            if (archetypeIds) {
                where.id = {
                    [Op.in]: archetypeIds
                };
            }

            const result = await Archetype.findAndCountAll({
                where,
                include,
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

    static async getFiveRandomHighlightedArchetypes(next) {
        try {
            return Archetype.findAll({
                where: {
                    is_highlighted: true
                },
                limit: 5,
                attributes: {
                    exclude: ['era_id']
                },
                include: [
                    { model: Era, as: 'era' }
                ]
            });
        } catch (error) {
            next(error);
        }
    }

    static async getEightMostFamousArchetypes(next) {
        try {
            return Archetype.findAll({
                where: {
                    is_active: true
                },
                order: [['popularity_poll', 'DESC']],
                limit: 8,
                attributes: {
                    exclude: ['era_id']
                },
                include: [
                    { model: Era, as: 'era' }
                ]
            });
        } catch (error) {
            next(error);
        }
    }

    static async getEightMostRecentArchetypes(next) {
        try {
            return Archetype.findAll({
                where: {
                    is_active: true
                },
                order: [['in_aw_date', 'DESC']],
                limit: 8,
                attributes: {
                    exclude: ['era_id']
                },
                include: [
                    { model: Era, as: 'era' }
                ]
            });
        } catch (error) {
            next(error);
        }
    }

    static async getArchetypeById(id, next) {
        try {
            return Archetype.findOne({
                where: {
                    id: id
                },
                attributes: {
                    exclude: ['era_id']
                },
                include: [
                    { model: Era, as: 'era' },
                    {
                        model: Type,
                        as: 'types',
                        through: {
                            attributes: []
                        }
                    },
                    {
                        model: Attribute,
                        as: 'attributes',
                        through: {
                            attributes: []
                        }
                    },
                    {
                        model: SummonMechanic,
                        as: 'summon_mechanics',
                        through: {
                            attributes: []
                        }
                    },
                    {
                        model: BanlistArchetypeCard,
                        as: 'cards',
                        attributes: {
                            exclude: ['id', 'banlist_id', 'archetype_id', 'card_id', 'created_at', 'updated_at']
                        },
                        include: [
                            {
                                model: Card,
                                as: 'card',
                                attributes: ['id', 'name', 'img_url', 'level', 'atk', 'def', 'attribute', 'card_type']
                            },
                            {
                                model: Banlist,
                                as: 'banlist',
                                attributes: ['id', 'label', 'release_date', 'description']
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

        } catch (error) {
            next(error);
        }
    }

    static async getRandomArchetype(next) {
        try {
            const archetype = await Archetype.findOne({
                order: Archetype.sequelize.random(),
                attributes: ['id', 'name']
            });

            return archetype;
        } catch (error) {
            next(error);
        }
    }

    static async getAllArchetypeNames(next) {
        try {
            return await Archetype.findAll({
                attributes: ['id', 'name']
            });
        } catch (error) {
            next(error);
        }
    }

    static async switchIsHighlighted(id, next) {
        try {
            const archetype = await Archetype.findByPk(id);

            if (!archetype) {
                throw new CustomError('Archetype not found', 404);
            }

            archetype.is_highlighted = !archetype.is_highlighted;

            await archetype.save();

            return archetype;
        } catch (error) {
            next(error);
        }
    }

    static async switchIsActive(id, next) {
        try {
            const archetype = await Archetype.findByPk(id);

            if (!archetype) {
                throw new CustomError('Archetype not found', 404);
            }

            archetype.is_active = !archetype.is_active;

            await archetype.save();

            return archetype;
        } catch (error) {
            next(error);
        }
    }

    static async switchAllToIsNotHighlighted(next) {
        try {
            await Archetype.update(
                {
                    is_highlighted: false
                },
                {
                    where: {}
                }
            );
        } catch (error) {
            next(error);
        }
    }

    static async switchAllToIsUnactive(next) {
        try {
            await Archetype.update(
                {
                    is_active: false
                },
                {
                    where: {}
                }
            );
        } catch (error) {
            next(error);
        }
    }

    static async resetPopularity(next) {
        try {
            await Archetype.update(
                {
                    popularity_poll: 0
                },
                {
                    where: {}
                }
            );
        } catch (error) {
            next(error);
        }
    }

    // POST

    /**
     * Ajoute un archétype avec toutes ses relations
     * @param {Object} request - Requête Express
     * @param {Object} response - Réponse Express
     * @param {Function} next - Fonction next Express
     */
    static async addArchetype(request, response) {
        try {
            const {
                name,
                main_info,
                slider_info,
                is_highlighted = false,
                is_active = false,
                in_tcg_date,
                in_aw_date,
                comment,
                popularity_poll = 0,
                era,
                attributes = [], // Array d'objets {id, label}
                types = [], // Array d'objets {id, label}
                summon_mechanics = [], // Array d'objets {id, label}
                cards = [], // Array d'objets BanlistArchetypeCard
                slider_img_url,
                card_img_url
            } = request.body;

            // Extraction des IDs des attributs, des types et des summon mechanics
            const attributeIds = attributes.map(attr => attr.id || attr);
            const typeIds = types.map(type => type.id || type);
            const summonMechanicIds = summon_mechanics.map(sm => sm.id || sm);

            // Vérification des cartes de banlist
            const banlistCardErrors = [];
            if (cards.length > 0) {
                for (let i = 0; i < cards.length; i++) {
                    const banlistCard = cards[i];

                    // Vérification de la banlist
                    if (banlistCard.banlist_id) {
                        const existingBanlist = await Banlist.findByPk(banlistCard.banlist_id);
                        if (!existingBanlist) {
                            banlistCardErrors.push({
                                index: i,
                                error: `Banlist avec l'ID ${banlistCard.banlist_id} n'existe pas`
                            });
                        }
                    }

                    // Vérification de la carte
                    if (banlistCard.card_id) {
                        const cardId = String(banlistCard.card_id);
                        const existingCard = await Card.findByPk(cardId);
                        if (!existingCard) {
                            banlistCardErrors.push({
                                index: i,
                                error: `Carte avec l'ID ${banlistCard.card_id} n'existe pas`
                            });
                        }
                    }

                    // Vérification du statut de carte
                    if (banlistCard.card_status_id) {
                        const existingCardStatus = await CardStatus.findByPk(banlistCard.card_status_id);
                        if (!existingCardStatus) {
                            banlistCardErrors.push({
                                index: i,
                                error: `Statut de carte avec l'ID ${banlistCard.card_status_id} n'existe pas`
                            });
                        }
                    }
                }

                if (banlistCardErrors.length > 0) {
                    return response.status(400).json({
                        success: false,
                        message: 'Erreurs dans les données des cartes de banlist',
                        errors: banlistCardErrors
                    });
                }
            }

            // Upload de l'image slider si fournie
            let uploadedSliderUrl = null;
            let uploadedCardUrl = null;

            if (slider_img_url) {
                try {
                    uploadedSliderUrl = await UploadImageService.uploadImage(slider_img_url, "jumbotron_archetypes");
                } catch (uploadError) {
                    return response.status(400).json({
                        success: false,
                        message: 'Erreur lors de l\'upload de l\'image slider: ' + uploadError.message
                    });
                }
            }

            if (card_img_url) {
                try {
                    uploadedCardUrl = await UploadImageService.uploadImage(card_img_url, "introduction_archetypes");
                } catch (uploadError) {
                    return response.status(400).json({
                        success: false,
                        message: 'Erreur lors de l\'upload de l\'image carte: ' + uploadError.message
                    });
                }
            }

            const result = await sequelize.transaction(async (t) => {

                const newArchetype = await Archetype.create({
                    name,
                    main_info,
                    slider_info,
                    is_highlighted,
                    is_active,
                    slider_img_url: uploadedSliderUrl,
                    card_img_url: uploadedCardUrl,
                    in_tcg_date,
                    in_aw_date,
                    comment,
                    popularity_poll,
                    era_id: era.id
                }, { transaction: t });

                // Ajout des relations avec les IDs extraits
                if (attributeIds.length > 0) {
                    await newArchetype.setAttributes(attributeIds, { transaction: t });
                }

                if (typeIds.length > 0) {
                    await newArchetype.setTypes(typeIds, { transaction: t });
                }

                if (summonMechanicIds.length > 0) {
                    await newArchetype.setSummon_mechanics(summonMechanicIds, { transaction: t });
                }

                // Ajout des cartes de banlist
                if (cards.length > 0) {
                    const currentBanlist = await Banlist.findOne({
                        order: [['release_date', 'DESC']]
                    });

                    const banlistCardData = cards.map(banlistCard => ({
                        banlist_id: banlistCard.banlist_id || currentBanlist?.id, // Utiliser la banlist actuelle par défaut
                        archetype_id: newArchetype.id,
                        card_id: banlistCard.card?.id && String(banlistCard.card?.id),
                        card_status_id: banlistCard.card_status_id || null,
                        explanation_text: banlistCard.explanation_text || null
                    }));

                    await BanlistArchetypeCard.bulkCreate(banlistCardData, { transaction: t });
                }

                // Récupération de l'archétype avec toutes ses relations
                const archetypeWithRelations = await Archetype.findByPk(newArchetype.id, {
                    include: [
                        { model: Era, as: 'era' },
                        {
                            model: Attribute,
                            as: 'attributes',
                            through: { attributes: [] }
                        },
                        {
                            model: Type,
                            as: 'types',
                            through: { attributes: [] }
                        },
                        {
                            model: SummonMechanic,
                            as: 'summon_mechanics',
                            through: { attributes: [] }
                        },
                        {
                            model: BanlistArchetypeCard,
                            as: 'cards',
                            include: [
                                {
                                    model: Card,
                                    as: 'card',
                                    attributes: ['id', 'name']
                                }
                            ]
                        }
                    ],
                    transaction: t
                });

                return archetypeWithRelations;
            });

            return response.status(201).json({
                success: true,
                message: 'Archétype créé avec succès',
                archetype: result
            });

        } catch (error) {
            console.error('Erreur lors de la création de l\'archétype:', error);
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'archétype',
                error: error.message
            });
        }
    }

    /**
     * Met à jour un archétype avec toutes ses relations
     * @param {Object} request - Requête Express
     * @param {Object} response - Réponse Express
     * @param {Function} next - Fonction next Express
     */
    static async updateArchetype(request, response) {

        const {
            id,
            name,
            main_info,
            slider_info,
            is_highlighted,
            is_active,
            in_tcg_date,
            in_aw_date,
            comment,
            popularity_poll,
            era, // Peut être un objet {id, label} ou un simple ID
            attributes = [], // Array d'objets {id, label}
            types = [], // Array d'objets {id, label}
            summon_mechanics = [], // Array d'objets {id, label}
            cards = [] // Array d'objets BanlistArchetypeCard
        } = request.body;

        try {

            // Extraction des IDs des attributs, des types et des summon mechanics
            const attributeIds = attributes.map(attr => attr.id || attr);
            const typeIds = types.map(type => type.id || type);
            const summonMechanicIds = summon_mechanics.map(sm => sm.id || sm);

            const existingArchetype = await Archetype.findByPk(id);

            // Vérification des cartes de banlist
            const banlistCardErrors = [];
            const validCards = [];

            if (cards.length > 0) {
                for (let i = 0; i < cards.length; i++) {
                    const banlistCard = cards[i];

                    // Extraction des IDs depuis la structure imbriquée
                    const cardId = banlistCard.card?.id || banlistCard.card_id;
                    const cardStatusId = banlistCard.card_status?.id || banlistCard.card_status_id;
                    const banlistId = banlistCard.banlist?.id || banlistCard.banlist_id;

                    // Vérification des champs obligatoires
                    if (!cardId || !cardStatusId) {
                        banlistCardErrors.push({
                            index: i,
                            error: 'card.id et card_status.id sont obligatoires pour chaque carte'
                        });
                        continue;
                    }

                    // Vérification de la banlist
                    if (banlistId) {
                        const existingBanlist = await Banlist.findByPk(banlistId);
                        if (!existingBanlist) {
                            banlistCardErrors.push({
                                index: i,
                                error: `Banlist avec l'ID ${banlistId} n'existe pas`
                            });
                            continue;
                        }
                    }

                    // Vérification de la carte
                    const formattedCardId = String(cardId);
                    const existingCard = await Card.findByPk(formattedCardId);
                    if (!existingCard) {
                        banlistCardErrors.push({
                            index: i,
                            error: `Carte avec l'ID ${cardId} n'existe pas`
                        });
                        continue;
                    }

                    // Vérification du statut de carte
                    const existingCardStatus = await CardStatus.findByPk(cardStatusId);
                    if (!existingCardStatus) {
                        banlistCardErrors.push({
                            index: i,
                            error: `Statut de carte avec l'ID ${cardStatusId} n'existe pas`
                        });
                        continue;
                    }

                    // Si toutes les vérifications passent, ajouter la carte à la liste valide
                    validCards.push({
                        banlist_id: banlistId,
                        card_id: cardId,
                        card_status_id: cardStatusId,
                        explanation_text: banlistCard.explanation_text || null
                    });
                }

                if (banlistCardErrors.length > 0) {
                    return response.status(400).json({
                        success: false,
                        message: 'Erreurs dans les données des cartes de banlist',
                        errors: banlistCardErrors
                    });
                }
            }

            // Mise à jour de l'archétype avec transaction
            const result = await sequelize.transaction(async (t) => {

                await existingArchetype.update({
                    name,
                    main_info,
                    slider_info,
                    is_highlighted,
                    is_active,
                    in_tcg_date,
                    in_aw_date,
                    comment,
                    popularity_poll,
                    era_id: era.id  // Utiliser l'ID extrait
                }, { transaction: t });

                // Mise à jour des relations (remplace complètement les anciennes)
                await existingArchetype.setAttributes(attributeIds, { transaction: t });
                await existingArchetype.setTypes(typeIds, { transaction: t });
                await existingArchetype.setSummon_mechanics(summonMechanicIds, { transaction: t });

                // Suppression de toutes les anciennes cartes de banlist
                await BanlistArchetypeCard.destroy({
                    where: { archetype_id: id },
                    transaction: t
                });

                // Ajout des nouvelles cartes de banlist
                if (validCards.length > 0) {
                    const banlistCardData = validCards.map(banlistCard => ({
                        banlist_id: banlistCard.banlist_id || null,
                        archetype_id: id,
                        card_id: String(banlistCard.card_id),
                        card_status_id: banlistCard.card_status_id,
                        explanation_text: banlistCard.explanation_text || null
                    }));

                    await BanlistArchetypeCard.bulkCreate(banlistCardData, { transaction: t });
                }

                // Récupération de l'archétype mis à jour avec toutes ses relations
                const updatedArchetype = await Archetype.findByPk(id, {
                    include: [
                        { model: Era, as: 'era' },
                        {
                            model: Attribute,
                            as: 'attributes',
                            through: { attributes: [] }
                        },
                        {
                            model: Type,
                            as: 'types',
                            through: { attributes: [] }
                        },
                        {
                            model: SummonMechanic,
                            as: 'summon_mechanics',
                            through: { attributes: [] }
                        },
                        {
                            model: BanlistArchetypeCard,
                            as: 'cards',
                            attributes: {
                                exclude: ['id', 'banlist_id', 'archetype_id', 'card_id', 'created_at', 'updated_at']
                            },
                            include: [
                                {
                                    model: Card,
                                    as: 'card',
                                    attributes: ['id', 'name', 'img_url', 'level', 'atk', 'def', 'attribute', 'card_type']
                                },
                                {
                                    model: Banlist,
                                    as: 'banlist',
                                    attributes: ['id', 'label', 'release_date', 'description']
                                },
                                {
                                    model: CardStatus,
                                    as: 'card_status',
                                    attributes: ['id', 'label']
                                }
                            ]
                        }
                    ],
                    transaction: t
                });

                return updatedArchetype;
            });

            return true;

        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'archétype:', error);
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'archétype',
                error: error.message
            });
        }
    }


    // DELETE
    static async deleteArchetype(id, next) {
        try {
            const archetypeToDelete = await Archetype.findByPk(id, {
                attributes: ['id', 'name', 'slider_img_url', 'card_img_url']
            });

            if (!archetypeToDelete) {
                throw new CustomError('Archétype non trouvé', 404);
            }

            const sliderUrlId = extractImageIdFromUrl(archetypeToDelete.slider_img_url);
            const cardUrlId = extractImageIdFromUrl(archetypeToDelete.card_img_url);

            if (sliderUrlId) {
                await UploadImageService.deleteImageFromCloudinary(sliderUrlId);
            }
            if (cardUrlId) {
                await UploadImageService.deleteImageFromCloudinary(cardUrlId);
            }
            // Supprimer l'archétype de la base de données avec transaction
            await sequelize.transaction(async (t) => {
                // Supprimer d'abord les relations
                await BanlistArchetypeCard.destroy({
                    where: { archetype_id: id },
                    transaction: t
                });

                // Supprimer l'archétype
                await Archetype.destroy({
                    where: { id },
                    transaction: t
                });
            })


            return true

        } catch (error) {
            console.error('Erreur lors de la suppression de l\'archétype:', error);
            next(error);
        }
    }
}

export default ArchetypeService; 