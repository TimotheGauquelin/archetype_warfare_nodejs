import { Router, Request, Response, NextFunction } from 'express';
import MedalController from '../controllers/MedalController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', (request: Request, response: Response, next: NextFunction) =>
    MedalController.getCatalog(request, response, next)
);

router.get(
    '/me',
    authenticateToken,
    requireRole(['User', 'Admin']),
    (request: Request, response: Response, next: NextFunction) =>
        MedalController.getMyMedals(request, response, next)
);

router.get(
    '/users/:userId',
    (request: Request, response: Response, next: NextFunction) =>
        MedalController.getUserPublicMedals(request, response, next)
);

router.post(
    '/me/sync',
    authenticateToken,
    requireRole(['User', 'Admin']),
    (request: Request, response: Response, next: NextFunction) =>
        MedalController.syncMyMedals(request, response, next)
);

export default router;
