import { Router } from 'express';
import CardTypeController from '../controllers/CardTypeController.js';
const router = Router();

router.get('/', (request, response) => CardTypeController.getAllCardTypes(request, response));

export default router;