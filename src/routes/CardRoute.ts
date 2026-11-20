import { Router, Request, Response, NextFunction } from 'express';
import CardController from '../controllers/CardController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();
const adminOnly = [authenticateToken, requireRole(['Admin'])];

router.get('/search', (request: Request, response: Response, next: NextFunction) =>
    CardController.searchCards(request, response, next)
);
router.get('/searchByArchetype/:archetypeId', (request: Request, response: Response, next: NextFunction) =>
    CardController.searchCardsByArchetypeBanlist(request, response, next)
);
router.get('/by-exact-name', (request: Request, response: Response, next: NextFunction) =>
    CardController.findCardByExactName(request, response, next)
);

router.get('/:id', (request: Request, response: Response, next: NextFunction) =>
    CardController.getCardDetail(request, response, next)
);
router.put('/:id', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    CardController.updateCardDetail(request, response, next)
);

router.post('/', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    CardController.addCards(request, response, next)
);

export default router;
