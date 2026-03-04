import { Router, Request, Response, NextFunction } from 'express';
import ArchetypeRankingController from '../controllers/ArchetypeRankingController';

const router = Router();

router.get('/masters', (req: Request, res: Response, next: NextFunction) =>
    ArchetypeRankingController.getAllMasters(req, res, next)
);
router.get('/archetype/:archetypeId', (req: Request, res: Response, next: NextFunction) =>
    ArchetypeRankingController.getArchetypeRanking(req, res, next)
);
router.get('/tournament/:tournamentId/winner', (req: Request, res: Response, next: NextFunction) =>
    ArchetypeRankingController.getTournamentWinner(req, res, next)
);

export default router;
