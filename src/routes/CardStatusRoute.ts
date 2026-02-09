import { Router, Request, Response } from 'express';
import CardStatusController from '../controllers/CardStatusController';

const router = Router();

router.get('/', (request: Request, response: Response) => CardStatusController.getAllCardStatus(request, response));

export default router;
