import { Router } from 'express';
import SummonMechanicController from '../controllers/SummonMechanicController.js';
const router = Router();

router.get('/', (request, response) => SummonMechanicController.getSummonMechanics(request, response));

export default router;