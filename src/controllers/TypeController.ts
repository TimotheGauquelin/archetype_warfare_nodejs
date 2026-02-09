import { Request, Response, NextFunction } from 'express';
import TypeService from '../services/TypeService';

class TypeController {
    async getTypes(_request: Request, response: Response, _next: NextFunction): Promise<void> {
        try {
            const types = await TypeService.getTypes();
            response.status(200).json(types);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            response.status(500).json({ message: errorMessage });
        }
    }
}

export default new TypeController();
