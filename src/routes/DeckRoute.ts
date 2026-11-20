import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import DeckController from '../controllers/DeckController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validation';

const router = Router();
const authUser = [authenticateToken, requireRole(['User', 'Admin'])];

router.get(
    '/all/user/:userId',
    ...authUser,
    (request: Request, response: Response, next: NextFunction) =>
        DeckController.getAllDecksByUserId(request, response, next)
);
router.put(
    '/updateMyDeck/:id',
    ...authUser,
    body('label').trim().notEmpty().withMessage('Le label du deck est obligatoire').isLength({ max: 120 }),
    body('archetype_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('comment').optional().isString().isLength({ max: 5000 }),
    validate,
    (request: Request, response: Response, next: NextFunction) =>
        DeckController.updateMyDeck(request, response, next)
);
router.delete(
    '/deleteMyDeck/:id',
    ...authUser,
    (request: Request, response: Response, next: NextFunction) =>
        DeckController.deleteMyDeck(request, response, next)
);
router.post(
    '/create',
    ...authUser,
    body('label').trim().notEmpty().withMessage('Le label du deck est obligatoire').isLength({ max: 120 }),
    body('archetype_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('comment').optional().isString().isLength({ max: 5000 }),
    body('deck_cards')
        .optional()
        .isArray()
        .custom((cards) => Array.isArray(cards) && cards.length <= 200)
        .withMessage('deck_cards ne peut pas dépasser 200 cartes'),
    validate,
    (request: Request, response: Response, next: NextFunction) =>
        DeckController.createDeck(request, response, next)
);
router.get(
    '/:id',
    ...authUser,
    (request: Request, response: Response, next: NextFunction) =>
        DeckController.getDeckById(request, response, next)
);

export default router;
