import { Router, Request, Response, NextFunction } from 'express';
import SummonMechanicController from '../controllers/SummonMechanicController';

const router = Router();

router.get('/', (request: Request, response: Response, next: NextFunction) => SummonMechanicController.getSummonMechanics(request, response, next));

export default router;
