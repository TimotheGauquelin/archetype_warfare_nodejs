import { Request, Response, NextFunction } from 'express';
import EraService from '../services/EraService';

class EraController {
    async getEras(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const eras = await EraService.getEras();
            response.status(200).json(eras);
        } catch (error) {
            next(error);
        }
    }
}

export default new EraController();
