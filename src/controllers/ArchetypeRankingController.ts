import { Request, Response, NextFunction } from 'express';
import ArchetypeRankingService from '../services/ArchetypeRankingService';
import ArchetypeService from '../services/ArchetypeService';
import { getStringParam, getUuidParam } from '../utils/request';

class ArchetypeRankingController {
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
            const archetypeId = await ArchetypeService.resolveArchetypeId(idOrSlug);
            if (archetypeId == null) {
                response.status(404).json({ message: 'Archétype introuvable' });
                return;
            }
            const result = await ArchetypeRankingService.getArchetypeRanking(archetypeId);
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
