import { SummonMechanic, Archetype } from '../models/relations.js';

class SummonMechanicService {
    static async getAllSummonMechanics() {
        return SummonMechanic.findAll({
            include: [{ model: Archetype }]
        });
    }

    static async getSummonMechanicById(id) {
        return SummonMechanic.findByPk(id, {
            include: [{ model: Archetype }]
        });
    }

    static async createSummonMechanic(data) {
        return SummonMechanic.create(data);
    }

    static async updateSummonMechanic(id, data) {
        const [updated] = await SummonMechanic.update(data, {
            where: { id },
            returning: true
        });
        return updated;
    }

    static async deleteSummonMechanic(id) {
        return SummonMechanic.destroy({
            where: { id }
        });
    }
}

export default SummonMechanicService; 