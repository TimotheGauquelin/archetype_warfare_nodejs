import { Router } from 'express';
import TypeController from '../controllers/TypeController.js';
const router = Router();

router.get('/', (request, response) => TypeController.getTypes(request, response));

export default router;