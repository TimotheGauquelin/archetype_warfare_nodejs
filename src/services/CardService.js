import { Card, Archetype, Type, Attribute, SummonMechanic } from '../models/relations.js';

class CardService {
    static async getAllCards() {
        return Card.findAll({
            include: [
                { model: Archetype },
                { model: Type },
                { model: Attribute },
                { model: SummonMechanic }
            ]
        });
    }

    static async getCardById(id) {
        return Card.findByPk(id, {
            include: [
                { model: Archetype },
                { model: Type },
                { model: Attribute },
                { model: SummonMechanic }
            ]
        });
    }

    static async createCard(data) {
        return Card.create(data);
    }

    static async updateCard(id, data) {
        const [updated] = await Card.update(data, {
            where: { id },
            returning: true
        });
        return updated;
    }

    static async deleteCard(id) {
        return Card.destroy({
            where: { id }
        });
    }
}

export default CardService; 