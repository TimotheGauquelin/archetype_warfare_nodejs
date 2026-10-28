import { Request, Response, NextFunction } from 'express';
import ArchetypeRankingService from '../services/ArchetypeRankingService';
import ArchetypeService from '../services/ArchetypeService';
import { getStringParam, getUuidParam } from '../utils/request';
import { CustomError } from '../errors/CustomError';

class ArchetypeRankingController {
    async getMyRankings(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (request as Request & { user?: { id?: string } }).user?.id;
            if (!userId) throw new CustomError('Non authentifié', 401);
            const rankings = await ArchetypeRankingService.getUserArchetypeRankings(userId);
            response.json(rankings);
        } catch (error) {
            next(error);
        }
    }

    async getTournamentWinner(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const tournamentId = getUuidParam(request.params.tournamentId);
            const winner = await ArchetypeRankingService.getTournamentWinner(tournamentId);
            if (!winner) {
                response.status(404).json({ message: 'Tournoi introuvable ou pas encore terminé' });
                return;
            }
            response.json(winner);
        } catch (error) {
            next(error);
        }
    }

    async getArchetypeRanking(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const idOrSlug = getStringParam(request.params.archetypeId);
            const archetype = await ArchetypeService.findByIdOrSlug(idOrSlug);
            if (!archetype || !archetype.is_active) {
                response.status(404).json({ message: 'Archétype introuvable' });
                return;
            }
            const result = await ArchetypeRankingService.getArchetypeRanking(archetype.id);
            if (!result) {
                response.status(404).json({ message: 'Archétype introuvable' });
                return;
            }
            response.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getAllMasters(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const masters = await ArchetypeRankingService.getAllMasters();
            response.json({ masters });
        } catch (error) {
            next(error);
        }
    }
}

export default new ArchetypeRankingController();
