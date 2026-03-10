import { Op, WhereOptions } from 'sequelize';
import { Archetype, Era, Type, Attribute, SummonMechanic, Card, Banlist, CardStatus, BanlistArchetypeCard } from '../models/relations';
import { CustomError } from '../errors/CustomError';
import sequelize from '../config/Sequelize';
import UploadImageService from './UploadImageService';
import { extractImageIdFromUrl } from '../utils/image';
import { Request, Response } from 'express';
import logger from '../utils/logger';
import { slugify } from '../utils/slugify';

interface SearchFilters {
    name?: string;
    era?: number;
    type?: string;
    attribute?: string;
    summonmechanic?: string;
    page?: number;
    size?: number;
    is_active?: boolean;
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

class ArchetypeService {
    /**
     * Trouve un archétype par ID (numérique) ou par slug.
     */
    static async findByIdOrSlug(idOrSlug: string): Promise<Archetype | null> {
        const trimmed = String(idOrSlug).trim();
        if (!trimmed) return null;
        const numericId = parseInt(trimmed, 10);
        if (!isNaN(numericId) && String(numericId) === trimmed) {
            return Archetype.findByPk(numericId);
        }
        return Archetype.findOne({ where: { slug: trimmed } });
    }

    /**
     * Résout un paramètre id ou slug en ID numérique (pour les services qui n'acceptent que l'id).
     */
    static async resolveArchetypeId(idOrSlug: string): Promise<number | null> {
        const archetype = await this.findByIdOrSlug(idOrSlug);
        return archetype ? archetype.id : null;
    }

    /**
     * Recherche d'archétypes avec filtres et pagination
     */
    static async searchArchetypes(filters: SearchFilters = {}): Promise<PaginatedResult<Archetype>> {
        const { name, era, type, attribute, summonmechanic, page = 1, size = 10, is_active } = filters;

        const limit = parseInt(String(size));
        const offset = (parseInt(String(page)) - 1) * limit;

        const where: WhereOptions = {};

        if (name) {
            where.name = {
                [Op.iLike]: `%${name}%`
            };
        }

        if (is_active) {
            where.is_active = is_active;
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
            {
                model: Type,
                as: 'types',
                through: { attributes: [] },
                attributes: ['id', 'label']
            },
            {
                model: Attribute,
                as: 'attributes',
                through: { attributes: [] },
                attributes: ['id', 'label']
            },
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
        let archetypeIds: number[] | null = null;

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
            archetypeIds = archetypesWithType.map(a => a.id as number);
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
            const attributeIds = archetypesWithAttribute.map(a => a.id as number);
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
            const summonMechanicIds = archetypesWithSummonMechanic.map(a => a.id as number);
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

    /**
     * Récupère 5 archétypes aléatoires mis en avant
     */
    static async getFiveRandomHighlightedArchetypes(): Promise<Archetype[]> {
        return Archetype.findAll({
            where: {
                is_highlighted: true,
                is_active: true
            },
            limit: 5,
            order: sequelize.literal('RANDOM()'),
            attributes: {
                exclude: ['era_id']
            },
            include: [
                { model: Era, as: 'era' }
            ]
        });
    }

    /**
     * Récupère les 8 archétypes les plus populaires
     */
    static async getEightMostFamousArchetypes(): Promise<Archetype[]> {
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
    }

    /**
     * Récupère les 8 archétypes les plus récents
     */
    static async getEightMostRecentArchetypes(): Promise<Archetype[]> {
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
    }

    /**
     * Récupère un archétype par son ID
     */
    static async getArchetypeById(id: number): Promise<Archetype> {
        const archetype = await Archetype.findOne({
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

        if (!archetype) {
            throw new CustomError('Archétype non trouvé', 404);
        }

        return archetype;
    }

    /**
     * Récupère un archétype par son ID ou son slug (détail complet).
     */
    static async getArchetypeByIdOrSlug(idOrSlug: string): Promise<Archetype> {
        const archetype = await this.findByIdOrSlug(idOrSlug);
        if (!archetype) {
            throw new CustomError('Archétype non trouvé', 404);
        }
        return this.getArchetypeById(archetype.id);
    }

    static async getRandomArchetype(): Promise<Archetype | null> {
        return Archetype.findOne({
            order: sequelize.literal('RANDOM()'),
            attributes: ['id', 'name']
        });
    }

    static async getAllArchetypeNames(): Promise<Array<{ id: number; name: string; slug?: string | null }>> {
        return Archetype.findAll({
            attributes: ['id', 'name', 'slug']
        });
    }

    static async switchIsHighlighted(id: number): Promise<Archetype> {
        const archetype = await Archetype.findByPk(id);

        if (!archetype) {
            throw new CustomError('Archetype not found', 404);
        }

        archetype.is_highlighted = !archetype.is_highlighted;
        await archetype.save();

        return archetype;
    }

    static async switchIsActive(id: number): Promise<Archetype> {
        const archetype = await Archetype.findByPk(id);

        if (!archetype) {
            throw new CustomError('Archetype not found', 404);
        }

        archetype.is_active = !archetype.is_active;
        await archetype.save();

        return archetype;
    }

    static async switchAllToIsNotHighlighted(): Promise<void> {
        await Archetype.update(
            {
                is_highlighted: false
            },
            {
                where: {}
            }
        );
    }

    static async switchAllToIsUnactive(): Promise<void> {
        await Archetype.update(
            {
                is_active: false
            },
            {
                where: {}
            }
        );
    }

    static async resetPopularity(): Promise<void> {
        await Archetype.update(
            {
                popularity_poll: 0
            },
            {
                where: {}
            }
        );
    }

    // POST - Méthodes qui utilisent encore request/response (à refactoriser plus tard)
    // Note: Ces méthodes doivent être refactorisées pour ne plus dépendre de HTTP
    static async addArchetype(request: Request, response: Response): Promise<void> {
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
                attributes = [],
                types = [],
                summon_mechanics = [],
                cards = [],
                slider_img_url,
                card_img_url,
                slug: slugInput
            } = request.body;

            const slug = slugInput && typeof slugInput === 'string' && slugInput.trim()
                ? slugInput.trim()
                : slugify(name);

            // Extraction des IDs
            const attributeIds = attributes.map((attr: { id?: number } | number) =>
                typeof attr === 'object' && attr.id ? attr.id : attr as number
            );
            const typeIds = types.map((type: { id?: number } | number) =>
                typeof type === 'object' && type.id ? type.id : type as number
            );
            const summonMechanicIds = summon_mechanics.map((sm: { id?: number } | number) =>
                typeof sm === 'object' && sm.id ? sm.id : sm as number
            );

            // Vérification des cartes de banlist
            const banlistCardErrors: Array<{ index: number; error: string }> = [];
            if (cards.length > 0) {
                for (let i = 0; i < cards.length; i++) {
                    const banlistCard = cards[i] as { banlist_id?: number; card_id?: string; card_status_id?: number };

                    if (banlistCard.banlist_id) {
                        const existingBanlist = await Banlist.findByPk(banlistCard.banlist_id);
                        if (!existingBanlist) {
                            banlistCardErrors.push({
                                index: i,
                                error: `Banlist avec l'ID ${banlistCard.banlist_id} n'existe pas`
                            });
                        }
                    }

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
                    response.status(400).json({
                        success: false,
                        message: 'Erreurs dans les données des cartes de banlist',
                        errors: banlistCardErrors
                    });
                    return;
                }
            }

            // Upload des images
            let uploadedSliderUrl: string | null = null;
            let uploadedCardUrl: string | null = null;

            if (slider_img_url) {
                try {
                    uploadedSliderUrl = await UploadImageService.uploadImage(slider_img_url, "jumbotron_archetypes");
                } catch (uploadError) {
                    const errorMessage = uploadError instanceof Error ? uploadError.message : 'Erreur inconnue';
                    response.status(400).json({
                        success: false,
                        message: 'Erreur lors de l\'upload de l\'image slider: ' + errorMessage
                    });
                    return;
                }
            }

            if (card_img_url) {
                try {
                    uploadedCardUrl = await UploadImageService.uploadImage(card_img_url, "introduction_archetypes");
                } catch (uploadError) {
                    const errorMessage = uploadError instanceof Error ? uploadError.message : 'Erreur inconnue';
                    response.status(400).json({
                        success: false,
                        message: 'Erreur lors de l\'upload de l\'image carte: ' + errorMessage
                    });
                    return;
                }
            }

            const result = await sequelize.transaction(async (t) => {
                const newArchetype = await Archetype.create({
                    name,
                    slug,
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
                    era_id: (era as { id: number }).id
                }, { transaction: t });

                if (attributeIds.length > 0) {
                    await newArchetype.setAttributes(attributeIds, { transaction: t });
                }

                if (typeIds.length > 0) {
                    await (newArchetype as any).setTypes(typeIds, { transaction: t });
                }

                if (summonMechanicIds.length > 0) {
                    await (newArchetype as any).setSummon_mechanics(summonMechanicIds, { transaction: t });
                }

                if (cards.length > 0) {
                    const currentBanlist = await Banlist.findOne({
                        order: [['release_date', 'DESC']]
                    });

                    const banlistCardData = cards.map((banlistCard: any) => ({
                        banlist_id: banlistCard.banlist_id || currentBanlist?.id,
                        archetype_id: newArchetype.id,
                        card_id: banlistCard.card?.id ? String(banlistCard.card.id) : undefined,
                        card_status_id: banlistCard.card_status_id || null,
                        explanation_text: banlistCard.explanation_text || null
                    }));

                    await BanlistArchetypeCard.bulkCreate(banlistCardData, { transaction: t });
                }

                const archetypeWithRelations = await Archetype.findByPk(newArchetype.id, {
                    include: [
                        { model: Era, as: 'era' },
                        { model: Attribute, as: 'attributes', through: { attributes: [] } },
                        { model: Type, as: 'types', through: { attributes: [] } },
                        { model: SummonMechanic, as: 'summon_mechanics', through: { attributes: [] } },
                        {
                            model: BanlistArchetypeCard,
                            as: 'cards',
                            include: [{ model: Card, as: 'card', attributes: ['id', 'name'] }]
                        }
                    ],
                    transaction: t
                });

                return archetypeWithRelations;
            });

            response.status(201).json({
                success: true,
                message: 'Archétype créé avec succès',
                archetype: result
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.logError('Erreur lors de la création de l\'archétype', error instanceof Error ? error : null);
            response.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'archétype',
                error: errorMessage
            });
        }
    }

    static async updateArchetype(request: Request, response: Response): Promise<void> {
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
            era,
            attributes = [],
            types = [],
            summon_mechanics = [],
            cards = [],
            slider_img_url,
            card_img_url,
            slug: slugInput
        } = request.body;

        try {
            const attributeIds = attributes.map((attr: { id?: number } | number) =>
                typeof attr === 'object' && attr.id ? attr.id : attr as number
            );
            const typeIds = types.map((type: { id?: number } | number) =>
                typeof type === 'object' && type.id ? type.id : type as number
            );
            const summonMechanicIds = summon_mechanics.map((sm: { id?: number } | number) =>
                typeof sm === 'object' && sm.id ? sm.id : sm as number
            );

            const existingArchetype = await Archetype.findByPk(id);
            if (!existingArchetype) {
                response.status(404).json({
                    success: false,
                    message: 'Archétype non trouvé'
                });
                return;
            }

            const banlistCardErrors: Array<{ index: number; error: string }> = [];
            const validCards: Array<{ banlist_id?: number; card_id: string; card_status_id: number; explanation_text?: string | null }> = [];

            if (cards.length > 0) {
                for (let i = 0; i < cards.length; i++) {
                    const banlistCard = cards[i] as any;
                    const cardId = banlistCard.card?.id || banlistCard.card_id;
                    const cardStatusId = banlistCard.card_status?.id || banlistCard.card_status_id;
                    const banlistId = banlistCard.banlist?.id || banlistCard.banlist_id;

                    if (!cardId || !cardStatusId) {
                        banlistCardErrors.push({
                            index: i,
                            error: 'card.id et card_status.id sont obligatoires pour chaque carte'
                        });
                        continue;
                    }

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

                    const formattedCardId = String(cardId);
                    const existingCard = await Card.findByPk(formattedCardId);
                    if (!existingCard) {
                        banlistCardErrors.push({
                            index: i,
                            error: `Carte avec l'ID ${cardId} n'existe pas`
                        });
                        continue;
                    }

                    const existingCardStatus = await CardStatus.findByPk(cardStatusId);
                    if (!existingCardStatus) {
                        banlistCardErrors.push({
                            index: i,
                            error: `Statut de carte avec l'ID ${cardStatusId} n'existe pas`
                        });
                        continue;
                    }

                    validCards.push({
                        banlist_id: banlistId,
                        card_id: String(cardId),
                        card_status_id: cardStatusId,
                        explanation_text: banlistCard.explanation_text || null
                    });
                }

                if (banlistCardErrors.length > 0) {
                    response.status(400).json({
                        success: false,
                        message: 'Erreurs dans les données des cartes de banlist',
                        errors: banlistCardErrors
                    });
                    return;
                }
            }

            // Gestion des images : ne ré-upload que si une nouvelle image différente est fournie
            // et supprime l'ancienne de Cloudinary dans ce cas.
            const oldSliderUrl = existingArchetype.slider_img_url as string | null;
            const oldCardUrl = existingArchetype.card_img_url as string | null;

            let uploadedSliderUrl: string | null = null;
            let uploadedCardUrl: string | null = null;

            if (typeof slider_img_url === 'string' && slider_img_url.trim()) {
                const trimmedSlider = slider_img_url.trim();
                if (trimmedSlider !== oldSliderUrl) {
                    try {
                        // Supprimer l'ancienne image si elle existe
                        if (oldSliderUrl) {
                            const oldSliderId = extractImageIdFromUrl(oldSliderUrl);
                            if (oldSliderId) {
                                await UploadImageService.deleteImageFromCloudinary(oldSliderId);
                            }
                        }
                        // Uploader la nouvelle image
                        uploadedSliderUrl = await UploadImageService.uploadImage(trimmedSlider, 'jumbotron_archetypes');
                    } catch (uploadError) {
                        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Erreur inconnue';
                        response.status(400).json({
                            success: false,
                            message: 'Erreur lors de l\'upload de l\'image slider: ' + errorMessage
                        });
                        return;
                    }
                }
            }

            if (typeof card_img_url === 'string' && card_img_url.trim()) {
                const trimmedCard = card_img_url.trim();
                if (trimmedCard !== oldCardUrl) {
                    try {
                        // Supprimer l'ancienne image si elle existe
                        if (oldCardUrl) {
                            const oldCardId = extractImageIdFromUrl(oldCardUrl);
                            if (oldCardId) {
                                await UploadImageService.deleteImageFromCloudinary(oldCardId);
                            }
                        }
                        // Uploader la nouvelle image
                        uploadedCardUrl = await UploadImageService.uploadImage(trimmedCard, 'introduction_archetypes');
                    } catch (uploadError) {
                        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Erreur inconnue';
                        response.status(400).json({
                            success: false,
                            message: 'Erreur lors de l\'upload de l\'image carte: ' + errorMessage
                        });
                        return;
                    }
                }
            }

            await sequelize.transaction(async (t) => {
                const updatePayload: Record<string, unknown> = {
                    name,
                    main_info,
                    slider_info,
                    is_highlighted,
                    is_active,
                    in_tcg_date,
                    in_aw_date,
                    comment,
                    popularity_poll,
                    era_id: (era as { id: number }).id
                };

                // Mettre à jour les URLs d'images uniquement si de nouvelles images ont été uploadées
                if (uploadedSliderUrl !== null) {
                    updatePayload.slider_img_url = uploadedSliderUrl;
                }
                if (uploadedCardUrl !== null) {
                    updatePayload.card_img_url = uploadedCardUrl;
                }

                if (slugInput !== undefined && typeof slugInput === 'string' && slugInput.trim()) {
                    updatePayload.slug = slugInput.trim();
                }
                await existingArchetype.update(updatePayload, { transaction: t });

                await (existingArchetype as any).setAttributes(attributeIds, { transaction: t });
                await (existingArchetype as any).setTypes(typeIds, { transaction: t });
                await (existingArchetype as any).setSummon_mechanics(summonMechanicIds, { transaction: t });

                await BanlistArchetypeCard.destroy({
                    where: { archetype_id: id },
                    transaction: t
                });

                if (validCards.length > 0) {
                    const banlistCardData = validCards.map(banlistCard => ({
                        banlist_id: banlistCard.banlist_id || null,
                        archetype_id: id,
                        card_id: banlistCard.card_id,
                        card_status_id: banlistCard.card_status_id,
                        explanation_text: banlistCard.explanation_text || null
                    }));

                    await BanlistArchetypeCard.bulkCreate(banlistCardData, { transaction: t });
                }
            });

            response.status(200).json({
                success: true,
                message: 'Archétype mis à jour avec succès'
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.logError('Erreur lors de la mise à jour de l\'archétype', error instanceof Error ? error : null);
            response.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'archétype',
                error: errorMessage
            });
        }
    }

    static async deleteArchetype(id: number): Promise<boolean> {
        const archetypeToDelete = await Archetype.findByPk(id, {
            attributes: ['id', 'name', 'slider_img_url', 'card_img_url']
        });

        if (!archetypeToDelete) {
            throw new CustomError('Archétype non trouvé', 404);
        }

        const sliderUrlId = extractImageIdFromUrl(archetypeToDelete.slider_img_url as string);
        const cardUrlId = extractImageIdFromUrl(archetypeToDelete.card_img_url as string);

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
        });

        return true;
    }
}

export default ArchetypeService;
