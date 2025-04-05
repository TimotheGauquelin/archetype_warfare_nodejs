import { Deck, DeckCard, Card, User } from '../models/relations.js';

class DeckService {
    static async getAllDecks() {
        return Deck.findAll({
            include: [
                { model: User },
                {
                    model: DeckCard,
                    include: [{ model: Card }]
                }
            ]
        });
    }

    static async getDeckById(id) {
        return Deck.findByPk(id, {
            include: [
                { model: User },
                {
                    model: DeckCard,
                    include: [{ model: Card }]
                }
            ]
        });
    }

    static async createDeck(data) {
        return Deck.create(data);
    }

    static async updateDeck(id, data) {
        const [updated] = await Deck.update(data, {
            where: { id },
            returning: true
        });
        return updated;
    }

    static async deleteDeck(id) {
        return Deck.destroy({
            where: { id }
        });
    }
}

export default DeckService; 