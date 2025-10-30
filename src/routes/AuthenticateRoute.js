import { Router } from 'express';
const router = Router();
import AuthenticateController from '../controllers/AuthenticateController.js';
import passwordRuler from '../middlewares/passwordRuler.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';
import usernameRuler from '../middlewares/usernameRuler.js';

router.post('/login', (request, result, next) => AuthenticateController.login(request, result, next));
router.post('/request-new-password', (request, result, next) => AuthenticateController.requestNewPassword(request, result, next));
router.put('/user/:userId/update-password', passwordRuler, (request, response, next) => AuthenticateController.updatePassword(request, response, next));
router.post('/register', usernameRuler, passwordRuler, (request, result, next) => AuthenticateController.register(request, result, next));
router.put('/admin/approve-user/:userId', authenticateToken, requireRole(['Admin']), (request, result, next) => AuthenticateController.adminApproveUser(request, result, next));

export default router;