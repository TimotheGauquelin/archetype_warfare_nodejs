import { Router, Request, Response, NextFunction } from 'express';
import BanlistController from '../controllers/BanlistController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/current', (request: Request, result: Response, next: NextFunction) => BanlistController.getCurrentBanlist(request, result, next));
router.get('/', (request: Request, result: Response, next: NextFunction) => BanlistController.getAllBanlists(request, result, next));
router.get('/:id', (request: Request, result: Response, next: NextFunction) => BanlistController.getBanlistById(request, result, next));

// POST
router.post('/', authenticateToken, requireRole(['Admin']), (request: Request, result: Response, next: NextFunction) => BanlistController.addBanlist(request, result, next));

// PUT
router.put('/:id', authenticateToken, requireRole(['Admin']), (request: Request, result: Response, next: NextFunction) => BanlistController.updateBanlist(request, result, next));

// DELETE
router.delete('/:id', authenticateToken, requireRole(['Admin']), (request: Request, result: Response, next: NextFunction) => BanlistController.deleteBanlist(request, result, next));

export default router;
