import { Op } from 'sequelize';
import { Archetype, Era, Type, Attribute, SummonMechanic, Card } from '../models/relations.js';

class ArchetypeService {
    static async searchArchetypes(request, response, next) {
        const { name, era, page = 1, size = 10 } = request.query;
        console.log(era);

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

        try {
            const { count, rows } = await Archetype.findAndCountAll({
                where,
                limit,
                offset,
                order: [['in_aw_date', 'DESC']],
                attributes: {
                    exclude: ['era_id']
                },
                include: [
                    { model: Era, as: 'era' }
                ]
            });

            return {
                data: rows,
                pagination: {
                    totalItems: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: parseInt(page),
                    pageSize: limit
                }
            };
        } catch (error) {
            next(error)
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
            next(error)
        }
    }

    static async getFiveMostFamousArchetypes(next) {
        try {
            return Archetype.findAll({
                order: [['popularity_poll', 'DESC']],
                limit: 5,
                attributes: {
                    exclude: ['era_id']
                },
                include: [
                    { model: Era, as: 'era' }
                ]
            });
        } catch (error) {
            next(error)
        }
    }

    static async getEightMostRecentArchetypes(next) {
        try {
            return Archetype.findAll({
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
            next(error)
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
                        model: Card,
                        as: 'cards',
                        through: {
                            attributes: []
                        }
                    },
                ]
            });

        } catch (error) {
            next(error)
        }
    }

    static async createArchetype(data) {
        return Archetype.create(data);
    }

    static async updateArchetype(id, data) {
        const [updated] = await Archetype.update(data, {
            where: { id },
            returning: true
        });
        return updated;
    }

    static async deleteArchetype(id) {
        return Archetype.destroy({
            where: { id }
        });
    }
}

export default ArchetypeService; 