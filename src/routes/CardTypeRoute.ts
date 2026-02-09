import { Router, Request, Response } from 'express';
import CardTypeController from '../controllers/CardTypeController';

const router = Router();

router.get('/', (request: Request, response: Response) => CardTypeController.getAllCardTypes(request, response));

export default router;
