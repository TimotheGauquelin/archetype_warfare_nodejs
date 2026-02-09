import { Router, Request, Response, NextFunction } from 'express';
import { usernameRuler } from '../middlewares/usernameRuler';
import UserController from '../controllers/UserController';

const router = Router();

// GET
router.get('/search', (request: Request, response: Response, next: NextFunction) => UserController.searchUsers(request, response, next));
router.get('/getUserByResetPassword/:token', (request: Request, response: Response, next: NextFunction) => UserController.getUserByResetPassword(request, response, next));
router.get('/getNewUsers', (request: Request, response: Response, next: NextFunction) => UserController.getNewUsers(request, response, next));
router.get('/:id', (request: Request, response: Response, next: NextFunction) => UserController.getUserById(request, response, next));

// POST
router.post('/', usernameRuler, (request: Request, response: Response, next: NextFunction) => UserController.createUser(request, response, next));
router.post('/admin/create', (request: Request, response: Response, next: NextFunction) => UserController.createUserByAdmin(request, response, next));

// PUT
router.put('/:id/switchIsActive', (request: Request, response: Response, next: NextFunction) => UserController.switchIsActive(request, response, next));
router.put('/:id/switchIsBanned', (request: Request, response: Response, next: NextFunction) => UserController.switchIsBanned(request, response, next));
router.put('/:id/updateUserByAdmin', (request: Request, response: Response, next: NextFunction) => UserController.updateUserByAdmin(request, response, next));
router.patch('/:id', (request: Request, response: Response, next: NextFunction) => UserController.updateMyProfile(request, response, next));
// DELETE
router.delete('/:id', (request: Request, response: Response, next: NextFunction) => UserController.deleteUser(request, response, next));

export default router;
