import {
    Banlist,
    BanlistArchetypeCard,
    BanlistReason,
    Archetype,
    Card,
    CardStatus,
} from '../models/relations';
import sequelize from '../config/Sequelize';
import { Op, type Includeable } from 'sequelize';
import BanlistReasonService from './BanlistReasonService';

interface BanlistArchetypeCardData {
    card_id: string;
    card_status_id: number;
    explanation_text?: string | null;
    archetype_id?: number | null;
    id?: number;
    reason_ids?: number[];
    reasons?: Array<{ id: number }>;
}

interface BanlistData {
    label: string;
    release_date: Date;
    description: string;
    is_active: boolean;
    is_event_banlist?: boolean;
    banlist_archetype_cards?: BanlistArchetypeCardData[];
}

type NormalizedCardData = {
    card_id: string;
    card_status_id: number;
    explanation_text: string | null;
    archetype_id: number | null;
    reason_ids: number[];
};

const parseReasonIds = (rawCard: BanlistArchetypeCardData): number[] => {
    if (Array.isArray(rawCard.reason_ids)) {
        return [
            ...new Set(
                rawCard.reason_ids
                    .map((id) => Number(id))
                    .filter((id) => !Number.isNaN(id) && id > 0)
            ),
        ];
    }
    if (Array.isArray(rawCard.reasons)) {
        return [
            ...new Set(
                rawCard.reasons
                    .map((r) => Number(r?.id))
                    .filter((id) => !Number.isNaN(id) && id > 0)
            ),
        ];
    }
    return [];
};

const bacReasonsInclude: Includeable = {
    model: BanlistReason,
    as: 'reasons',
    attributes: ['id', 'slug', 'label', 'text', 'logo_url'],
    through: { attributes: [] },
};

class BanlistService {
    static async getAllBanlists(): Promise<Banlist[]> {
        return Banlist.findAll();
    }

    static async getBanlistById(id: number, showArchetypeCards: boolean = false): Promise<Banlist | null> {
        const banlist = await Banlist.findOne({
            where: { id },
            include: [
                {
                    model: BanlistArchetypeCard,
                    as: 'banlist_archetype_cards',
                    where: showArchetypeCards ? {} : { archetype_id: null },
                    required: false,
                    include: [
                        {
                            model: Card,
                            as: 'card',
                            attributes: ['id', 'name', 'img_url', 'level', 'atk', 'def', 'card_type'],
                        },
                        {
                            model: CardStatus,
                            as: 'card_status',
                        },
                        bacReasonsInclude,
                    ],
                },
            ],
        });

        if (!banlist || showArchetypeCards) {
            return banlist;
        }

        const banlistJson = banlist.toJSON() as Banlist & {
            banlist_archetype_cards?: Array<{ card_status?: { label?: string } }>;
        };
        const cards = banlistJson.banlist_archetype_cards ?? [];
        banlistJson.banlist_archetype_cards = cards.filter((card) => {
            const label = card.card_status?.label?.toLowerCase() ?? '';
            return label !== 'unlimited';
        }) as typeof cards;

        return banlistJson as Banlist;
    }

    static async getCurrentBanlist(includeArchetypeCards: boolean = true): Promise<Banlist | null> {
        const today = new Date();
        const includeArchetypeCardsCondition = includeArchetypeCards ? {} : { archetype_id: null };

        return Banlist.findOne({
            order: [['release_date', 'DESC']],
            where: {
                is_active: true,
                is_event_banlist: false,
                release_date: {
                    [Op.lte]: today,
                },
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
                            attributes: ['id', 'name', 'img_url', 'level', 'atk', 'def', 'card_type'],
                        },
                        {
                            model: CardStatus,
                            as: 'card_status',
                            attributes: ['id', 'label'],
                        },
                        {
                            model: Archetype,
                            as: 'archetype',
                            attributes: ['id', 'name'],
                        },
                        bacReasonsInclude,
                    ],
                },
            ],
        });
    }

    static async addBanlist(banlistData: BanlistData): Promise<void> {
        const transaction = await sequelize.transaction();
        try {
            const { banlist_archetype_cards, label, release_date, description, is_active, is_event_banlist } =
                banlistData;

            const banlist = await Banlist.create(
                {
                    label: label,
                    release_date: release_date,
                    description: description,
                    is_active: is_active,
                    is_event_banlist: is_event_banlist ?? false,
                },
                { transaction }
            );

            if (banlist_archetype_cards && Array.isArray(banlist_archetype_cards) && banlist_archetype_cards.length > 0) {
                const unlimitedStatus = await CardStatus.findOne({
                    where: { label: { [Op.iLike]: 'unlimited' } },
                    attributes: ['id'],
                    transaction,
                });
                const unlimitedId = unlimitedStatus?.id ?? null;

                for (const card of banlist_archetype_cards) {
                    const archetypeId = card.archetype_id ?? null;
                    if (
                        archetypeId == null &&
                        unlimitedId != null &&
                        Number(card.card_status_id) === Number(unlimitedId)
                    ) {
                        continue;
                    }
                    const created = await BanlistArchetypeCard.create(
                        {
                            banlist_id: banlist.id,
                            card_id: card.card_id,
                            card_status_id: card.card_status_id,
                            explanation_text: card.explanation_text || null,
                            archetype_id: archetypeId,
                        },
                        { transaction }
                    );
                    await BanlistReasonService.syncCardReasons(
                        created.id,
                        parseReasonIds(card),
                        transaction
                    );
                }
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateBanlist(
        banlistId: number,
        databaseBanlist: Banlist,
        banlistData: BanlistData
    ): Promise<void> {
        const transaction = await sequelize.transaction();
        try {
            const { banlist_archetype_cards, ...banlistFields } = banlistData;

            await databaseBanlist.update(banlistFields, { transaction });

            if (!banlist_archetype_cards || banlist_archetype_cards.length === 0) {
                await BanlistArchetypeCard.destroy({
                    where: {
                        banlist_id: banlistId,
                        archetype_id: null,
                    },
                    transaction,
                });
                await transaction.commit();
                return;
            }

            const unlimitedStatus = await CardStatus.findOne({
                where: { label: { [Op.iLike]: 'unlimited' } },
                attributes: ['id'],
                transaction,
            });
            const unlimitedId = unlimitedStatus?.id ?? null;

            const desiredByCardId = new Map<string, NormalizedCardData>();

            for (const rawCard of banlist_archetype_cards) {
                const cardId = rawCard.card_id != null ? String(rawCard.card_id) : '';
                const cardStatusId = parseInt(String((rawCard as { card_status_id?: unknown }).card_status_id), 10);
                const archetypeId =
                    rawCard.archetype_id == null ? null : parseInt(String(rawCard.archetype_id), 10);

                if (archetypeId == null && unlimitedId != null && cardStatusId === Number(unlimitedId)) {
                    continue;
                }
                const explanationText = rawCard.explanation_text ?? null;

                if (!cardId) {
                    throw new Error('card_id est requis pour chaque élément de banlist_archetype_cards');
                }
                if (Number.isNaN(cardStatusId)) {
                    throw new Error(`card_status_id invalide pour card_id=${cardId}`);
                }
                if (archetypeId !== null && Number.isNaN(archetypeId)) {
                    throw new Error(`archetype_id invalide pour card_id=${cardId}`);
                }

                const normalized: NormalizedCardData = {
                    card_id: cardId,
                    card_status_id: cardStatusId,
                    explanation_text: explanationText,
                    archetype_id: archetypeId,
                    reason_ids: parseReasonIds(rawCard),
                };

                const existing = desiredByCardId.get(cardId);
                if (!existing) {
                    desiredByCardId.set(cardId, normalized);
                    continue;
                }

                if (existing.archetype_id == null && normalized.archetype_id != null) {
                    desiredByCardId.set(cardId, normalized);
                }
            }

            const desiredCardIds = [...desiredByCardId.keys()];

            const existingNullCardsInBanlist = await BanlistArchetypeCard.findAll({
                where: {
                    banlist_id: banlistId,
                    archetype_id: null,
                },
                attributes: ['id', 'card_id'],
                transaction,
            });

            const cardsToDeleteIds: number[] = [];
            for (const existingNullCard of existingNullCardsInBanlist) {
                const cardId = String(existingNullCard.card_id ?? '');
                if (!cardId) continue;
                if (!desiredByCardId.has(cardId)) {
                    cardsToDeleteIds.push(existingNullCard.id);
                }
            }

            const existingCardsForPayload = await BanlistArchetypeCard.findAll({
                where: {
                    banlist_id: banlistId,
                    card_id: {
                        [Op.in]: desiredCardIds,
                    },
                },
                attributes: ['id', 'card_id', 'archetype_id', 'card_status_id', 'explanation_text'],
                transaction,
            });

            const keyOf = (cardId: string, archetypeId: number | null) =>
                `${cardId}::${archetypeId ?? 'null'}`;

            const existingByKey = new Map<string, BanlistArchetypeCard>();
            const existingRowsByCardId = new Map<string, BanlistArchetypeCard[]>();

            for (const row of existingCardsForPayload) {
                const cardId = String(row.card_id ?? '');
                if (!cardId) continue;
                const archId = row.archetype_id == null ? null : row.archetype_id;
                existingByKey.set(keyOf(cardId, archId), row);

                const list = existingRowsByCardId.get(cardId) ?? [];
                list.push(row);
                existingRowsByCardId.set(cardId, list);
            }

            const cardStatusIds = [...new Set([...desiredByCardId.values()].map((c) => c.card_status_id))];
            const archetypeIds = [
                ...new Set(
                    [...desiredByCardId.values()]
                        .map((c) => c.archetype_id)
                        .filter((id): id is number => id != null)
                ),
            ];
            const allReasonIds = [
                ...new Set([...desiredByCardId.values()].flatMap((c) => c.reason_ids)),
            ];

            const validationPromises: Promise<void>[] = [];

            if (desiredCardIds.length > 0) {
                validationPromises.push(
                    Card.findAll({
                        where: { id: desiredCardIds },
                        attributes: ['id'],
                    }).then((existingCards) => {
                        const existingCardIds = existingCards.map((card) => card.id);
                        const missingCardIds = desiredCardIds.filter((id) => !existingCardIds.includes(id));
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
                        attributes: ['id'],
                    }).then((existingCardStatuses) => {
                        const existingCardStatusIds = existingCardStatuses.map((status) => status.id);
                        const missingCardStatusIds = cardStatusIds.filter(
                            (id) => !existingCardStatusIds.includes(id)
                        );
                        if (missingCardStatusIds.length > 0) {
                            throw new Error(
                                `Les statuts de cartes suivants n'existent pas: ${missingCardStatusIds.join(', ')}`
                            );
                        }
                    })
                );
            }

            if (archetypeIds.length > 0) {
                validationPromises.push(
                    Archetype.findAll({
                        where: { id: archetypeIds },
                        attributes: ['id'],
                    }).then((existingArchetypes) => {
                        const existingArchetypeIds = existingArchetypes.map((archetype) => archetype.id);
                        const missingArchetypeIds = archetypeIds.filter(
                            (id) => !existingArchetypeIds.includes(id)
                        );
                        if (missingArchetypeIds.length > 0) {
                            throw new Error(
                                `Les archétypes suivants n'existent pas: ${missingArchetypeIds.join(', ')}`
                            );
                        }
                    })
                );
            }

            await Promise.all(validationPromises);
            await BanlistReasonService.assertReasonIdsExist(allReasonIds);

            if (cardsToDeleteIds.length > 0) {
                await BanlistArchetypeCard.destroy({
                    where: { id: cardsToDeleteIds },
                    transaction,
                });
            }

            for (const [cardId, desired] of desiredByCardId) {
                const desiredKey = keyOf(cardId, desired.archetype_id);
                const existingDesired = existingByKey.get(desiredKey);
                const keepDesiredRowId = existingDesired?.id ?? null;
                let targetRowId: number | null = keepDesiredRowId;

                if (existingDesired) {
                    const shouldUpdate =
                        existingDesired.card_status_id !== desired.card_status_id ||
                        existingDesired.explanation_text !== desired.explanation_text;

                    if (shouldUpdate) {
                        await BanlistArchetypeCard.update(
                            {
                                card_status_id: desired.card_status_id,
                                explanation_text: desired.explanation_text,
                            },
                            { where: { id: existingDesired.id }, transaction }
                        );
                    }
                } else {
                    const created = await BanlistArchetypeCard.create(
                        {
                            banlist_id: banlistId,
                            card_id: cardId,
                            card_status_id: desired.card_status_id,
                            explanation_text: desired.explanation_text,
                            archetype_id: desired.archetype_id,
                        },
                        { transaction }
                    );
                    targetRowId = created.id;
                }

                const existingRows = existingRowsByCardId.get(cardId) ?? [];
                for (const row of existingRows) {
                    const rowArchId = row.archetype_id == null ? null : row.archetype_id;
                    const isDesiredVariant = rowArchId === desired.archetype_id;
                    const isExtraDesiredRow =
                        isDesiredVariant && keepDesiredRowId != null && row.id !== keepDesiredRowId;

                    if (!isDesiredVariant || isExtraDesiredRow) {
                        await BanlistArchetypeCard.destroy({
                            where: { id: row.id },
                            transaction,
                        });
                    }
                }

                if (targetRowId != null) {
                    await BanlistReasonService.syncCardReasons(
                        targetRowId,
                        desired.reason_ids,
                        transaction
                    );
                }
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async deleteBanlist(id: number): Promise<void> {
        await Banlist.destroy({
            where: { id },
        });
    }
}

export default BanlistService;
