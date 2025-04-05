import { Attribute, Archetype } from '../models/relations.js';

class AttributeService {
    static async getAllAttributes() {
        return Attribute.findAll({
            include: [{ model: Archetype }]
        });
    }

    static async getAttributeById(id) {
        return Attribute.findByPk(id, {
            include: [{ model: Archetype }]
        });
    }

    static async createAttribute(data) {
        return Attribute.create(data);
    }

    static async updateAttribute(id, data) {
        const [updated] = await Attribute.update(data, {
            where: { id },
            returning: true
        });
        return updated;
    }

    static async deleteAttribute(id) {
        return Attribute.destroy({
            where: { id }
        });
    }
}

export default AttributeService; 