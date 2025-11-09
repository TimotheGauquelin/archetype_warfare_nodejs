import { Router } from 'express';
import { usernameRuler } from '../middlewares/usernameRuler.js';
import UserController from '../controllers/UserController.js';

const router = Router();

// GET
router.get('/search', (request, response, next) => UserController.searchUsers(request, response, next));
router.get('/getUserByResetPassword/:token', (request, response, next) => UserController.getUserByResetPassword(request, response, next));
router.get('/getNewUsers', (request, response, next) => UserController.getNewUsers(request, response, next));
router.get('/:id', (request, response, next) => UserController.getUserById(request, response, next));

// POST
router.post('/', usernameRuler, (request, response, next) => UserController.createUser(request, response, next));
router.post('/admin/create', (request, response, next) => UserController.createUserByAdmin(request, response, next));

// PUT
router.put('/:id', (request, response, next) => UserController.updateUser(request, response, next));
router.put('/:id/switchIsActive', (request, response, next) => UserController.switchIsActive(request, response, next));
router.put('/:id/switchIsBanned', (request, response, next) => UserController.switchIsBanned(request, response, next));
router.put('/:id/updateUserByAdmin', (request, response, next) => UserController.updateUserByAdmin(request, response, next));

// DELETE
router.delete('/:id', (request, response, next) => UserController.deleteUser(request, response, next));

export default router;