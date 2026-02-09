import { Request, Response, NextFunction } from 'express';
import SummonMechanicService from '../services/SummonMechanicService';

class SummonMechanicController {
    async getSummonMechanics(_request: Request, response: Response, _next: NextFunction): Promise<void> {
        try {
            const summonmechanics = await SummonMechanicService.getSummonMechanics();
            response.status(200).json(summonmechanics);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            response.status(500).json({ message: errorMessage });
        }
    }
}

export default new SummonMechanicController();
