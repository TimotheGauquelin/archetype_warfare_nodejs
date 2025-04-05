import { Router } from 'express';
import CardStatusController from '../controllers/CardStatusController.js';
const router = Router();

router.get('/', (request, response) => CardStatusController.getAllCardStatus(request, response));

export default router;