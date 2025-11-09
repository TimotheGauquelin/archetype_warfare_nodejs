import { Router } from 'express';
import BanlistController from '../controllers/BanlistController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/current', (request, result) => BanlistController.getCurrentBanlist(request, result));
router.get('/', (request, result) => BanlistController.getAllBanlists(request, result));
router.get('/:id', (request, result, next) => BanlistController.getBanlistById(request, result, next));

// POST
router.post('/', authenticateToken, requireRole(['Admin']), (request, result) => BanlistController.addBanlist(request, result));

// PUT
router.put('/:id', authenticateToken, requireRole(['Admin']), (request, result, next) => BanlistController.updateBanlist(request, result, next));

// DELETE
router.delete('/:id', authenticateToken, requireRole(['Admin']), (request, result, next) => BanlistController.deleteBanlist(request, result, next));

export default router;