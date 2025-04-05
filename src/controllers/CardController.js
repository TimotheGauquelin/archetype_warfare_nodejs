import CardService from "../services/CardService.js";

class CardController {
    async searchCards(request, response) {
        try {

            const cards = await CardService.searchCards(request, response)
            return response.status(200).json(cards)

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async addCards(request, response) {
        try {

            const cards = await CardService.addCards(request, response)
            return response.status(201).json(cards)

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }
}

export default new CardController()