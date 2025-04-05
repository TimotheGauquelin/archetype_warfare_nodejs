import { Router } from 'express';
const router = Router();
import AuthenticateController from '../controllers/AuthenticateController.js';
import passwordRuler from '../middlewares/passwordRuler.js';

router.post('/login', (request, result, next) => AuthenticateController.login(request, result, next));
router.get('/discord/redirect', (request, result, next) => AuthenticateController.discordLogin(request, result, next));
router.get('/discord/callback', (request, result, next) => AuthenticateController.discordCallback(request, result, next));
router.post('/request-new-password', (request, result, next) => AuthenticateController.requestNewPassword(request, result, next));
router.put('/user/:userId/update-password', passwordRuler, (request, response, next) => AuthenticateController.updatePassword(request, response, next));

export default router;