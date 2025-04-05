import { Router } from 'express';
import EraController from '../controllers/EraController.js';
const router = Router();

router.get('/', (request, response, next) => EraController.getEras(request, response, next));

export default router;