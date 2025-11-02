import { Router } from 'express';
import DeckController from '../controllers/DeckController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';
const router = Router();

router.get('/all/user/:userId', authenticateToken, requireRole(['User']), (request, response, next) => DeckController.getAllDecksByUserId(request, response, next));
router.put('/updateMyDeck/:id', authenticateToken, requireRole(['User']), (request, response, next) => DeckController.updateMyDeck(request, response, next));
router.delete('/deleteMyDeck/:id', authenticateToken, requireRole(['User']), (request, response, next) => DeckController.deleteMyDeck(request, response, next));
router.post('/create', authenticateToken, requireRole(['User']), (request, response, next) => DeckController.createDeck(request, response, next));
router.get('/:id', authenticateToken, requireRole(['User']), (request, response, next) => DeckController.getDeckById(request, response, next));

export default router;