import { Router, Request, Response, NextFunction } from 'express';
import DeckController from '../controllers/DeckController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/all/user/:userId', authenticateToken, requireRole(['User']), (request: Request, response: Response, next: NextFunction) => DeckController.getAllDecksByUserId(request, response, next));
router.put('/updateMyDeck/:id', authenticateToken, requireRole(['User']), (request: Request, response: Response, next: NextFunction) => DeckController.updateMyDeck(request, response, next));
router.delete('/deleteMyDeck/:id', authenticateToken, requireRole(['User']), (request: Request, response: Response, next: NextFunction) => DeckController.deleteMyDeck(request, response, next));
router.post('/create', authenticateToken, requireRole(['User']), (request: Request, response: Response, next: NextFunction) => DeckController.createDeck(request, response, next));
router.get('/:id', authenticateToken, requireRole(['User']), (request: Request, response: Response, next: NextFunction) => DeckController.getDeckById(request, response, next));

export default router;
