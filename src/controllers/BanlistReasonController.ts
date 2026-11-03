import { Request, Response, NextFunction } from 'express';
import BanlistReasonService from '../services/BanlistReasonService';
import { getIntParam } from '../utils/request';

class BanlistReasonController {
    async getAll(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const reasons = await BanlistReasonService.getAll();
            response.status(200).json(reasons);
        } catch (error) {
            next(error);
        }
    }

    async getById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.id);
            const reason = await BanlistReasonService.getById(id);
            if (!reason) {
                response.status(404).json({ message: 'Raison introuvable' });
                return;
            }
            response.status(200).json(reason);
        } catch (error) {
            next(error);
        }
    }

    async create(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const reason = await BanlistReasonService.create(request.body);
            response.status(201).json(reason);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            if (
                message.includes('obligatoire') ||
                message.includes('existe déjà')
            ) {
                response.status(400).json({ message });
                return;
            }
            next(error);
        }
    }

    async update(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.id);
            const reason = await BanlistReasonService.update(id, request.body);
            response.status(200).json(reason);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            if (message === 'Raison introuvable') {
                response.status(404).json({ message });
                return;
            }
            if (
                message.includes('obligatoire') ||
                message.includes('existe déjà')
            ) {
                response.status(400).json({ message });
                return;
            }
            next(error);
        }
    }

    async delete(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.id);
            await BanlistReasonService.delete(id);
            response.status(200).json({ message: 'Raison supprimée' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            if (message === 'Raison introuvable') {
                response.status(404).json({ message });
                return;
            }
            next(error);
        }
    }
}

export default new BanlistReasonController();
