import { Router } from 'express';
import AttributeController from '../controllers/AttributeController.js';
const router = Router();

router.get('/', (request, response, next) => AttributeController.getAttributes(request, response, next));

export default router;