import { Router } from 'express';
import SummonMechanicController from '../controllers/SummonMechanicController.js';
const router = Router();

router.get('/', (request, response, next) => SummonMechanicController.getSummonMechanics(request, response, next));

export default router;