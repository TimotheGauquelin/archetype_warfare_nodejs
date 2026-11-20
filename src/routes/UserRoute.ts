import { Router, Request, Response, NextFunction } from 'express';
import { usernameRuler } from '../middlewares/usernameRuler';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import UserController from '../controllers/UserController';

const router = Router();

const adminOnly = [authenticateToken, requireRole(['Admin'])];

// GET — public / reset
router.get('/getUserByResetPassword/:token', (request: Request, response: Response, next: NextFunction) =>
    UserController.getUserByResetPassword(request, response, next)
);
router.get('/:id/public', (request: Request, response: Response, next: NextFunction) =>
    UserController.getPublicProfile(request, response, next)
);

// GET — admin
router.get('/search', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.searchUsers(request, response, next)
);
router.get('/roles', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.listRoles(request, response, next)
);
router.get('/getNewUsers', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.getNewUsers(request, response, next)
);
router.get('/:id/admin/quiz', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.getUserQuizSummary(request, response, next)
);
router.get('/:id/admin/tournaments', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.getUserTournamentsSummary(request, response, next)
);

// GET — soi-même ou admin
router.get('/:id', authenticateToken, (request: Request, response: Response, next: NextFunction) =>
    UserController.getUserById(request, response, next)
);

// POST — admin
router.post('/', ...adminOnly, usernameRuler, (request: Request, response: Response, next: NextFunction) =>
    UserController.createUser(request, response, next)
);
router.post('/admin/create', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.createUserByAdmin(request, response, next)
);
router.post('/:id/admin/send-password-reset', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.adminSendPasswordReset(request, response, next)
);

// PUT — admin
router.put('/:id/switchIsActive', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.switchIsActive(request, response, next)
);
router.put('/:id/switchIsBanned', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.switchIsBanned(request, response, next)
);
router.put('/:id/updateUserByAdmin', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.updateUserByAdmin(request, response, next)
);

// Profil / MDP — utilisateur connecté
router.patch('/:id', authenticateToken, (request: Request, response: Response, next: NextFunction) =>
    UserController.updateMyProfile(request, response, next)
);
router.put('/:id/password', authenticateToken, (request: Request, response: Response, next: NextFunction) =>
    UserController.changeMyPassword(request, response, next)
);

// DELETE — admin
router.delete('/:id', ...adminOnly, (request: Request, response: Response, next: NextFunction) =>
    UserController.deleteUser(request, response, next)
);

export default router;
