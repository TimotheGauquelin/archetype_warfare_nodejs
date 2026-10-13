import { Op } from 'sequelize';
import { Deck, DeckCard, Card, Archetype, BanlistArchetypeCard } from '../models/relations';
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

type LinkedArchetype = { id: number; name: string };

class DeckService {
    /**
     * Annote chaque deck_card avec :
     * - linked_archetypes : archétypes (BAC non null) auxquels la carte appartient
     * - is_legal_for_deck : jouable pour l'archétype du deck (générique ou liée à cet archétype)
     * - foreign_archetypes : archétypes liés autres que celui du deck
     */
    static async annotateDeckCardsLegality(deck: Deck | null): Promise<Record<string, unknown> | null> {
        if (!deck) {
            return null;
        }

        const deckJson = deck.toJSON() as Record<string, unknown> & {
            archetype_id?: number | string | null;
            deck_cards?: Array<Record<string, unknown> & {
                card_id?: string;
                card?: { id?: string };
            }>;
        };

        const deckCards = deckJson.deck_cards ?? [];
        const deckArchetypeId =
            deckJson.archetype_id == null ? null : Number(deckJson.archetype_id);

        if (deckCards.length === 0) {
            return deckJson;
        }

        const cardIds = [
            ...new Set(
                deckCards
                    .map((dc) => String(dc.card_id ?? dc.card?.id ?? ''))
                    .filter(Boolean)
            ),
        ];

        const bacRows = await BanlistArchetypeCard.findAll({
            where: {
                card_id: { [Op.in]: cardIds },
                [Op.and]: [
                    { archetype_id: { [Op.not]: null } },
                    { archetype_id: { [Op.ne]: 0 } },
                ],
            },
            attributes: ['card_id', 'archetype_id'],
            include: [
                {
                    model: Archetype,
                    as: 'archetype',
                    attributes: ['id', 'name'],
                    required: false,
                },
            ],
        });

        const linksByCardId = new Map<string, LinkedArchetype[]>();
        for (const row of bacRows) {
            const archId = row.archetype_id == null ? null : Number(row.archetype_id);
            if (archId == null || archId === 0) {
                continue;
            }
            const cardId = String(row.card_id);
            const name =
                (row as BanlistArchetypeCard & { archetype?: { name?: string } }).archetype?.name
                ?? `Archetype #${archId}`;
            const list = linksByCardId.get(cardId) ?? [];
            if (!list.some((a) => a.id === archId)) {
                list.push({ id: archId, name });
            }
            linksByCardId.set(cardId, list);
        }

        deckJson.deck_cards = deckCards.map((dc) => {
            const cardId = String(dc.card_id ?? dc.card?.id ?? '');
            const linked = linksByCardId.get(cardId) ?? [];
            const isLegal =
                deckArchetypeId == null
                || linked.length === 0
                || linked.some((a) => a.id === deckArchetypeId);
            const foreignArchetypes =
                deckArchetypeId == null
                    ? linked
                    : linked.filter((a) => a.id !== deckArchetypeId);

            return {
                ...dc,
                linked_archetypes: linked,
                is_legal_for_deck: isLegal,
                foreign_archetypes: foreignArchetypes,
            };
        });

        return deckJson;
    }

    /**
     * Refuse les cartes liées uniquement à d'autres archétypes que celui du deck.
     */
    static async assertCardsLegalForArchetype(
        cardIds: string[],
        archetypeId: number | string | null | undefined,
        transaction?: import('sequelize').Transaction
    ): Promise<void> {
        if (archetypeId == null || cardIds.length === 0) {
            return;
        }

        const deckArchetypeId = Number(archetypeId);
        if (Number.isNaN(deckArchetypeId)) {
            return;
        }

        const uniqueIds = [...new Set(cardIds.map(String).filter(Boolean))];
        const bacRows = await BanlistArchetypeCard.findAll({
            where: {
                card_id: { [Op.in]: uniqueIds },
                [Op.and]: [
                    { archetype_id: { [Op.not]: null } },
                    { archetype_id: { [Op.ne]: 0 } },
                ],
            },
            attributes: ['card_id', 'archetype_id'],
            include: [
                {
                    model: Archetype,
                    as: 'archetype',
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: Card,
                    as: 'card',
                    attributes: ['id', 'name'],
                    required: false,
                },
            ],
            transaction,
        });

        const linksByCardId = new Map<string, LinkedArchetype[]>();
        for (const row of bacRows) {
            const archId = row.archetype_id == null ? null : Number(row.archetype_id);
            if (archId == null || archId === 0) {
                continue;
            }
            const cardId = String(row.card_id);
            const name =
                (row as BanlistArchetypeCard & { archetype?: { name?: string } }).archetype?.name
                ?? `Archetype #${archId}`;
            const list = linksByCardId.get(cardId) ?? [];
            if (!list.some((a) => a.id === archId)) {
                list.push({ id: archId, name });
            }
            linksByCardId.set(cardId, list);
        }

        const illegalNames: string[] = [];
        for (const cardId of uniqueIds) {
            const linked = linksByCardId.get(cardId) ?? [];
            if (linked.length === 0) {
                continue;
            }
            if (linked.some((a) => a.id === deckArchetypeId)) {
                continue;
            }
            const rowForCard = bacRows.find((r) => String(r.card_id) === cardId) as
                | (BanlistArchetypeCard & { card?: { name?: string } })
                | undefined;
            illegalNames.push(rowForCard?.card?.name ?? cardId);
        }

        if (illegalNames.length > 0) {
            throw new CustomError(
                `Impossible d'enregistrer le deck : ${illegalNames.length} carte(s) appartiennent à un autre archétype (${illegalNames.slice(0, 5).join(', ')}${illegalNames.length > 5 ? '…' : ''}). Retirez-les avant de sauvegarder.`,
                400
            );
        }
    }

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

    static async getDeckById(id: string): Promise<Record<string, unknown> | null> {
        const deck = await Deck.findByPk(id, {
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

        return DeckService.annotateDeckCardsLegality(deck);
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

                await DeckService.assertCardsLegalForArchetype(
                    cardIds,
                    body.archetype_id ?? deck.archetype_id,
                    transaction
                );

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

    static async updateMyDeck(
        id: string,
        body: UpdateDeckData,
        existingDeck: Deck | Record<string, unknown>
    ): Promise<Deck> {
        const { label, comment, archetype_id, deck_cards } = body;
        const existing = existingDeck as Deck;
        const transaction = await sequelize.transaction();

        try {
            await Deck.update({
                label: label ? label.trim() : existing.label,
                comment: comment !== undefined ? comment : existing.comment,
                archetype_id: archetype_id !== undefined ? archetype_id : existing.archetype_id,
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

                const effectiveArchetypeId =
                    archetype_id !== undefined ? archetype_id : existing.archetype_id;

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

                    await DeckService.assertCardsLegalForArchetype(
                        cardIds,
                        effectiveArchetypeId,
                        transaction
                    );

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
                    },
                    {
                        model: Archetype,
                        as: 'archetype',
                        attributes: ['id', 'name', 'is_active'],
                        required: false
                    }
                ]
            });

            if (!updatedDeck) {
                throw new CustomError('Deck non trouvé après mise à jour', 404);
            }

            const annotated = await DeckService.annotateDeckCardsLegality(updatedDeck);
            return annotated as unknown as Deck;
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
