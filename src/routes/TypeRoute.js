import { Router } from 'express';
import TypeController from '../controllers/TypeController.js';
const router = Router();

router.get('/', (request, response, next) => TypeController.getTypes(request, response, next));

export default router;