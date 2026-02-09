import { Router, Request, Response, NextFunction } from 'express';
import EraController from '../controllers/EraController';

const router = Router();

router.get('/', (request: Request, response: Response, next: NextFunction) => EraController.getEras(request, response, next));

export default router;
