import { Router, Request, Response, NextFunction } from 'express';
import CardController from '../controllers/CardController';

const router = Router();

router.get('/search', (request: Request, response: Response, next: NextFunction) => CardController.searchCards(request, response, next));
router.get('/searchByArchetype/:archetypeId', (request: Request, response: Response, next: NextFunction) => CardController.searchCardsByArchetypeBanlist(request, response, next));

router.post('/', (request: Request, response: Response, next: NextFunction) => CardController.addCards(request, response, next));

export default router;
