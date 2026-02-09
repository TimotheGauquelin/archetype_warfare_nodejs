import { Router, Request, Response, NextFunction } from 'express';
import AttributeController from '../controllers/AttributeController';

const router = Router();

router.get('/', (request: Request, response: Response, next: NextFunction) => AttributeController.getAttributes(request, response, next));

export default router;
