import { Router } from 'express';
import CardController from '../controllers/CardController.js';
const router = Router();

router.get('/search', (request, response, next) => CardController.searchCards(request, response, next));
router.get('/searchByArchetype/:archetypeId', (request, response, next) => CardController.searchCardsByArchetypeBanlist(request, response, next));

router.post('/', (request, response, next) => CardController.addCards(request, response, next));

export default router;