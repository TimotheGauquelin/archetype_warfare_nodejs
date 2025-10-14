import CardTypeService from '../services/CardTypeService.js';

class CardTypeController {
    async getAllCardTypes(request, response) {
        try {

            const cards = await CardTypeService.getAllCardTypes(request, response);
            return response.status(200).json(cards);

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }
}

export default new CardTypeController();