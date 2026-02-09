import { Router, Request, Response, NextFunction } from 'express';
import TypeController from '../controllers/TypeController';

const router = Router();

router.get('/', (request: Request, response: Response, next: NextFunction) => TypeController.getTypes(request, response, next));

export default router;
