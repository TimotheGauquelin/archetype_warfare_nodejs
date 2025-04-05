import { Era, Archetype } from '../models/relations.js';

class EraService {
    static async getAllEras() {
        return Era.findAll({
            include: [{ model: Archetype }]
        });
    }

    static async getEraById(id) {
        return Era.findByPk(id, {
            include: [{ model: Archetype }]
        });
    }

    static async createEra(data) {
        return Era.create(data);
    }

    static async updateEra(id, data) {
        const [updated] = await Era.update(data, {
            where: { id },
            returning: true
        });
        return updated;
    }

    static async deleteEra(id) {
        return Era.destroy({
            where: { id }
        });
    }
}

export default EraService; 