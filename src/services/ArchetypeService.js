import { Archetype, Era, Type, Attribute, SummonMechanic } from '../models/relations.js';

class ArchetypeService {
    static async getAllArchetypes() {
        return Archetype.findAll({
            include: [
                { model: Era },
                { model: Type },
                { model: Attribute },
                { model: SummonMechanic }
            ]
        });
    }

    static async getArchetypeById(id) {
        return Archetype.findByPk(id, {
            include: [
                { model: Era },
                { model: Type },
                { model: Attribute },
                { model: SummonMechanic }
            ]
        });
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