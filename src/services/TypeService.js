import { Type, Archetype } from '../models/relations.js';

class TypeService {
    static async getAllTypes() {
        return Type.findAll({
            include: [{ model: Archetype }]
        });
    }

    static async getTypeById(id) {
        return Type.findByPk(id, {
            include: [{ model: Archetype }]
        });
    }

    static async createType(data) {
        return Type.create(data);
    }

    static async updateType(id, data) {
        const [updated] = await Type.update(data, {
            where: { id },
            returning: true
        });
        return updated;
    }

    static async deleteType(id) {
        return Type.destroy({
            where: { id }
        });
    }
}

export default TypeService; 