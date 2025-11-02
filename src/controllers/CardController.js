import CardService from '../services/CardService.js';

class CardController {
    async searchCards(request, response, next) {
        try {
            const cards = await CardService.searchCards(request, response, next);
            return response.status(200).json(cards);
        } catch (error) {
            next(error);
        }
    }

    async addCards(request, response, next) {
        try {

            const cards = await CardService.addCards(request, response);
            return cards;

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async searchCardsByArchetypeBanlist(request, response, next) {
        try {
            const cards = await CardService.searchCardsByArchetypeBanlist(request, response, next);
            return response.status(200).json(cards);
        } catch (error) {
            next(error);
        }
    }
}

export default new CardController();