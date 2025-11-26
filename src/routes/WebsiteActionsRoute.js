import { Router } from 'express';
import WebsiteActionsController from '../controllers/WebsiteActionsController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', (request, response, next) =>
    WebsiteActionsController.getConfig(request, response, next)
);

router.put('/stream-banner', authenticateToken, requireRole(['Admin']), (request, response, next) =>
    WebsiteActionsController.toggleStreamBanner(request, response, next)
);

router.put('/registration', authenticateToken, requireRole(['Admin']), (request, response, next) =>
    WebsiteActionsController.toggleRegistration(request, response, next)
);

export default router;
