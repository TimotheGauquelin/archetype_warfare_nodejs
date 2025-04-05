import { Router } from 'express';
import AttributeController from '../controllers/AttributeController.js';
const router = Router();

router.get('/', (request, response) => AttributeController.getAttributes(request, response));

export default router;