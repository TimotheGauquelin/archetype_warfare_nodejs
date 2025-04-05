import { Router } from 'express';
import CardController from '../controllers/CardController.js';
const router = Router();

router.get('/search', (request, response) => CardController.searchCards(request, response));

//

router.post('/', (request, response) => CardController.addCards(request, response))

export default router;