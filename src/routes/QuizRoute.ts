import { Router, Request, Response, NextFunction } from 'express';
import QuizController from '../controllers/QuizController';
import {
    authenticateToken,
    optionalAuthenticateToken,
    requireRole,
} from '../middlewares/authMiddleware';

const router = Router();

router.get('/themes', (req: Request, res: Response, next: NextFunction) =>
    QuizController.getThemes(req, res, next)
);
router.get(
    '/hub',
    optionalAuthenticateToken,
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.getHub(req, res, next)
);

router.get(
    '/admin/seasons',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.listAdminSeasons(req, res, next)
);
router.post(
    '/admin/seasons',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.createAdminSeason(req, res, next)
);
router.get(
    '/admin/seasons/:seasonId/podium',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.getAdminSeasonPodium(req, res, next)
);
router.post(
    '/admin/seasons/:seasonId/auto-schedule',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.autoFillAdminSeasonSchedule(req, res, next)
);
router.get(
    '/admin/seasons/:seasonId',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.getAdminSeason(req, res, next)
);
router.put(
    '/admin/seasons/:seasonId',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.updateAdminSeason(req, res, next)
);
router.delete(
    '/admin/seasons/:seasonId',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.deleteAdminSeason(req, res, next)
);

router.get(
    '/admin/questions',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.listAdminQuestions(req, res, next)
);
router.post(
    '/admin/questions',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.createAdminQuestion(req, res, next)
);
router.put(
    '/admin/questions/switchAllToInactive',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.switchAllToInactive(req, res, next)
);
router.put(
    '/admin/questions/switchAllToNonDaily',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.switchAllToNonDaily(req, res, next)
);
router.put(
    '/admin/questions/:questionId',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.updateAdminQuestion(req, res, next)
);
router.delete(
    '/admin/questions/:questionId',
    authenticateToken,
    requireRole(['Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.deleteAdminQuestion(req, res, next)
);

router.get('/me/stats', authenticateToken, (req: Request, res: Response, next: NextFunction) =>
    QuizController.getMyStats(req, res, next)
);

router.post('/attempts/free', authenticateToken, (req: Request, res: Response, next: NextFunction) =>
    QuizController.startFree(req, res, next)
);
router.post(
    '/attempts/daily',
    authenticateToken,
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.startDaily(req, res, next)
);
// Compat ancienne URL thématisée
router.post(
    '/attempts/daily/:theme',
    authenticateToken,
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.startDaily(req, res, next)
);
router.get(
    '/attempts/:attemptId',
    authenticateToken,
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.getAttempt(req, res, next)
);
router.post(
    '/attempts/:attemptId/answers',
    authenticateToken,
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.submitAnswer(req, res, next)
);
router.post(
    '/attempts/:attemptId/finish',
    authenticateToken,
    (req: Request, res: Response, next: NextFunction) =>
        QuizController.finishAttempt(req, res, next)
);

export default router;
