import CardStatusService from '../services/CardStatusService.js';

class CardStatusController {
    async getAllCardStatus(request, response) {
        try {

            const status = await CardStatusService.getAllCardStatuses(request, response);
            return response.status(200).json(status);

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }
}

export default new CardStatusController();