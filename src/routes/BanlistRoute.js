import { Router } from 'express';
import BanlistController from '../controllers/BanlistController.js';
const router = Router();

router.get('/current', (request, result) => BanlistController.getCurrentBanlist(request, result));
router.get('/', (request, result) => BanlistController.getAllBanlists(request, result));

// POST
router.post('/', (request, result) => BanlistController.addBanlist(request, result));

export default router;