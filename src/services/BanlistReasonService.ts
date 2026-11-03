import { Op } from 'sequelize';
import BanlistReason from '../models/BanlistReasonModel';
import BanlistArchetypeCardReason from '../models/BanlistArchetypeCardReasonModel';

export interface BanlistReasonInput {
    slug?: string;
    label: string;
    text: string;
    logo_url?: string | null;
}

const slugify = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);

class BanlistReasonService {
    static async getAll(): Promise<BanlistReason[]> {
        return BanlistReason.findAll({
            order: [
                ['label', 'ASC'],
                ['id', 'ASC'],
            ],
        });
    }

    static async getById(id: number): Promise<BanlistReason | null> {
        return BanlistReason.findByPk(id);
    }

    static async create(data: BanlistReasonInput): Promise<BanlistReason> {
        const label = data.label?.trim();
        const text = data.text?.trim();
        if (!label) {
            throw new Error('Le label est obligatoire');
        }
        if (!text) {
            throw new Error('Le texte est obligatoire');
        }

        const slug = (data.slug?.trim() || slugify(label));
        if (!slug) {
            throw new Error('Le slug est obligatoire');
        }

        const existing = await BanlistReason.findOne({ where: { slug } });
        if (existing) {
            throw new Error(`Une raison avec le slug "${slug}" existe déjà`);
        }

        return BanlistReason.create({
            slug,
            label,
            text,
            logo_url: data.logo_url?.trim() || null,
        });
    }

    static async update(id: number, data: Partial<BanlistReasonInput>): Promise<BanlistReason> {
        const reason = await BanlistReason.findByPk(id);
        if (!reason) {
            throw new Error('Raison introuvable');
        }

        const nextLabel = data.label !== undefined ? data.label.trim() : reason.label;
        const nextText = data.text !== undefined ? data.text.trim() : reason.text;
        if (!nextLabel) {
            throw new Error('Le label est obligatoire');
        }
        if (!nextText) {
            throw new Error('Le texte est obligatoire');
        }

        let nextSlug = reason.slug;
        if (data.slug !== undefined) {
            nextSlug = data.slug.trim() || slugify(nextLabel);
        } else if (data.label !== undefined && data.slug === undefined) {
            // garder le slug existant si seul le label change
            nextSlug = reason.slug;
        }

        if (!nextSlug) {
            throw new Error('Le slug est obligatoire');
        }

        const slugConflict = await BanlistReason.findOne({
            where: {
                slug: nextSlug,
                id: { [Op.ne]: id },
            },
        });
        if (slugConflict) {
            throw new Error(`Une raison avec le slug "${nextSlug}" existe déjà`);
        }

        await reason.update({
            slug: nextSlug,
            label: nextLabel,
            text: nextText,
            logo_url:
                data.logo_url !== undefined
                    ? data.logo_url?.trim() || null
                    : reason.logo_url,
        });

        return reason;
    }

    static async delete(id: number): Promise<void> {
        const reason = await BanlistReason.findByPk(id);
        if (!reason) {
            throw new Error('Raison introuvable');
        }

        await BanlistArchetypeCardReason.destroy({
            where: { banlist_reason_id: id },
        });
        await reason.destroy();
    }

    static async assertReasonIdsExist(reasonIds: number[]): Promise<void> {
        if (!reasonIds.length) return;
        const uniqueIds = [...new Set(reasonIds)];
        const found = await BanlistReason.findAll({
            where: { id: uniqueIds },
            attributes: ['id'],
        });
        if (found.length !== uniqueIds.length) {
            const foundIds = new Set(found.map((r) => r.id));
            const missing = uniqueIds.filter((id) => !foundIds.has(id));
            throw new Error(`Raisons introuvables: ${missing.join(', ')}`);
        }
    }

    static async syncCardReasons(
        banlistArchetypeCardId: number,
        reasonIds: number[],
        transaction?: import('sequelize').Transaction
    ): Promise<void> {
        const uniqueIds = [...new Set(reasonIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id) && id > 0))];
        await this.assertReasonIdsExist(uniqueIds);

        await BanlistArchetypeCardReason.destroy({
            where: { banlist_archetype_card_id: banlistArchetypeCardId },
            transaction,
        });

        if (!uniqueIds.length) return;

        await BanlistArchetypeCardReason.bulkCreate(
            uniqueIds.map((banlist_reason_id, index) => ({
                banlist_archetype_card_id: banlistArchetypeCardId,
                banlist_reason_id,
                position: index,
            })),
            { transaction }
        );
    }
}

export default BanlistReasonService;
