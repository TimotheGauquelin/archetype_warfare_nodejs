import { Request, Response, NextFunction } from 'express';
import MedalService from '../services/MedalService';

class MedalController {
    async getCatalog(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const medals = await MedalService.listCatalog();
            response.status(200).json(medals);
        } catch (error) {
            next(error);
        }
    }

    async getMyMedals(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user?.id;
            if (!userId) {
                response.status(401).json({ message: 'Non authentifié' });
                return;
            }
            const result = await MedalService.listForUser(userId);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getUserPublicMedals(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.params.userId;
            if (!userId) {
                response.status(400).json({ message: 'userId requis' });
                return;
            }
            const result = await MedalService.listForUser(userId);
            response.status(200).json({ earned: result.earned ?? [], locked: [] });
        } catch (error) {
            next(error);
        }
    }

    async syncMyMedals(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.user?.id;
            if (!userId) {
                response.status(401).json({ message: 'Non authentifié' });
                return;
            }
            const newlyAwarded = await MedalService.syncUser(userId);
            const result = await MedalService.listForUser(userId);
            response.status(200).json({ newlyAwarded, ...result });
        } catch (error) {
            next(error);
        }
    }
}

export default new MedalController();
