import { Router, Request, Response, NextFunction } from 'express';
import TournamentController from '../controllers/TournamentController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Routes avec segments littéraux en premier (pour ne pas capturer "rounds" ou "matches" comme tournamentId)
router.get('/rounds/:roundId', (req: Request, res: Response, next: NextFunction) => TournamentController.getRound(req, res, next));
router.put('/rounds/:roundId/complete', authenticateToken, requireRole(['Admin']), (req: Request, res: Response, next: NextFunction) => TournamentController.completeRound(req, res, next));
router.put('/matches/:matchId/result', authenticateToken, requireRole(['User', 'Admin']), (req: Request, res: Response, next: NextFunction) => TournamentController.recordMatchResult(req, res, next));

router.get('/', (req: Request, res: Response, next: NextFunction) => TournamentController.getAllCurrentTournaments(req, res, next));
router.get('/my-tournaments', authenticateToken, (req: Request, res: Response, next: NextFunction) => TournamentController.getUserTournaments(req, res, next));
router.get('/:tournamentId/standings', (req: Request, res: Response, next: NextFunction) => TournamentController.getStandings(req, res, next));
router.get('/:tournamentId/my-details', authenticateToken, (req: Request, res: Response, next: NextFunction) => TournamentController.getMyTournamentDetails(req, res, next));
router.get('/:tournamentId', (req: Request, res: Response, next: NextFunction) => TournamentController.getById(req, res, next));

router.post('/', authenticateToken, requireRole(['Admin']), (req: Request, res: Response, next: NextFunction) => TournamentController.create(req, res, next));
router.put('/:tournamentId', authenticateToken, requireRole(['Admin']), (req: Request, res: Response, next: NextFunction) => TournamentController.update(req, res, next));
router.post('/:tournamentId/register', authenticateToken, (req: Request, res: Response, next: NextFunction) => TournamentController.registerToATournament(req, res, next));
router.post('/:tournamentId/unregister', authenticateToken, (req: Request, res: Response, next: NextFunction) => TournamentController.unregisterToATournament(req, res, next));
router.post('/:tournamentId/rounds/start', authenticateToken, requireRole(['Admin']), (req: Request, res: Response, next: NextFunction) => TournamentController.startNextRound(req, res, next));

export default router;
