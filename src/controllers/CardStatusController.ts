import { Request, Response } from 'express';
import CardStatusService from '../services/CardStatusService';

class CardStatusController {
    async getAllCardStatus(_request: Request, response: Response): Promise<void> {
        try {
            const status = await CardStatusService.getAllCardStatuses();
            response.status(200).json(status);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            response.status(500).json({ message: errorMessage });
        }
    }
}

export default new CardStatusController();
