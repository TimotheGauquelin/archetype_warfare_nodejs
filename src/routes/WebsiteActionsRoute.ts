import { Router, Request, Response, NextFunction } from 'express';
import WebsiteActionsController from '../controllers/WebsiteActionsController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', (request: Request, response: Response, next: NextFunction) =>
    WebsiteActionsController.getConfig(request, response, next)
);

router.put('/stream-banner', authenticateToken, requireRole(['Admin']), (request: Request, response: Response, next: NextFunction) =>
    WebsiteActionsController.toggleStreamBanner(request, response, next)
);

router.put('/registration', authenticateToken, requireRole(['Admin']), (request: Request, response: Response, next: NextFunction) =>
    WebsiteActionsController.toggleRegistration(request, response, next)
);

export default router;
