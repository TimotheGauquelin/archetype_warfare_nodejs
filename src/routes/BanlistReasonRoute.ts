import { Router, Request, Response, NextFunction } from 'express';
import BanlistReasonController from '../controllers/BanlistReasonController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', (request: Request, response: Response, next: NextFunction) =>
    BanlistReasonController.getAll(request, response, next)
);
router.get('/:id', (request: Request, response: Response, next: NextFunction) =>
    BanlistReasonController.getById(request, response, next)
);

router.post(
    '/',
    authenticateToken,
    requireRole(['Admin']),
    (request: Request, response: Response, next: NextFunction) =>
        BanlistReasonController.create(request, response, next)
);

router.put(
    '/:id',
    authenticateToken,
    requireRole(['Admin']),
    (request: Request, response: Response, next: NextFunction) =>
        BanlistReasonController.update(request, response, next)
);

router.delete(
    '/:id',
    authenticateToken,
    requireRole(['Admin']),
    (request: Request, response: Response, next: NextFunction) =>
        BanlistReasonController.delete(request, response, next)
);

export default router;
