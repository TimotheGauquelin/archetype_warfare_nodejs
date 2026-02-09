import { Request, Response } from 'express';
import CardTypeService from '../services/CardTypeService';

class CardTypeController {
    async getAllCardTypes(_request: Request, response: Response): Promise<void> {
        try {
            const cards = await CardTypeService.getAllCardTypes();
            response.status(200).json(cards);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            response.status(500).json({ message: errorMessage });
        }
    }
}

export default new CardTypeController();
