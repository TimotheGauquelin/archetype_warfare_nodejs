import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import AuthenticateController from '../controllers/AuthenticateController';
import passwordRuler from '../middlewares/passwordRuler';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import usernameRuler from '../middlewares/usernameRuler';
import { loginLimiter, registerLimiter, requestNewPasswordLimiter } from '../middlewares/rateLimitMiddleware';
import { validate } from '../middlewares/validation';

const router = Router();

router.post('/login',
    loginLimiter,
    body('email')
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('L\'email doit être une adresse email valide')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Le mot de passe est requis')
        .isString().withMessage('Le mot de passe doit être une chaîne de caractères'),
    validate,
    (request: Request, result: Response, next: NextFunction) => AuthenticateController.login(request, result, next)
);
router.post('/request-new-password',
    requestNewPasswordLimiter,
    body('email')
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('L\'email doit être une adresse email valide')
        .normalizeEmail(),
    validate,
    (request: Request, result: Response, next: NextFunction) => AuthenticateController.requestNewPassword(request, result, next));
router.put('/user/:userId/update-password', passwordRuler, (request: Request, response: Response, next: NextFunction) => AuthenticateController.updatePassword(request, response, next));
router.post('/register', usernameRuler, passwordRuler, registerLimiter, (request: Request, result: Response, next: NextFunction) => AuthenticateController.register(request, result, next));
router.put('/admin/approve-user/:userId', authenticateToken, requireRole(['Admin']), (request: Request, result: Response, next: NextFunction) => AuthenticateController.adminApproveUser(request, result, next));

export default router;
