import { Router, Request, Response, NextFunction } from 'express';
import ArchetypeController from '../controllers/ArchetypeController';
import { validateSearchArchetypes, validateGetArchetypeById } from '../validators/archetypeValidators';
import { validateRequest } from '../middlewares/validation';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();
const adminOnly = [authenticateToken, requireRole(['Admin'])];

// GET — public
router.get('/getFiveRandomHighlightedArchetypes', ArchetypeController.getFiveRandomHighlightedArchetypes.bind(ArchetypeController));
router.get('/getEightMostFamousArchetypes', ArchetypeController.getEightMostFamousArchetypes.bind(ArchetypeController));
router.get('/getEightMostRecentArchetypes', ArchetypeController.getEightMostRecentArchetypes.bind(ArchetypeController));
router.get('/search', validateRequest(validateSearchArchetypes), ArchetypeController.searchArchetypes.bind(ArchetypeController));
router.get('/random', ArchetypeController.getRandomArchetype.bind(ArchetypeController));
router.get('/allNames', ArchetypeController.getAllArchetypeNames.bind(ArchetypeController));
router.get(
    '/admin/:id',
    ...adminOnly,
    validateRequest(validateGetArchetypeById),
    ArchetypeController.getAdminArchetypeById.bind(ArchetypeController)
);
router.get(
    '/:id',
    validateRequest(validateGetArchetypeById),
    ArchetypeController.getArchetypeById.bind(ArchetypeController)
);

// Mutations — admin
router.post('/', ...adminOnly, (request: Request, response: Response, next: NextFunction): void => {
    ArchetypeController.addArchetype(request, response, next).catch(next);
});

router.put('/:archetypeId/update', ...adminOnly, (request: Request, response: Response, next: NextFunction): void => {
    ArchetypeController.updateArchetype(request, response, next).catch(next);
});
router.put('/:archetypeId/switchIsHighlighted', ...adminOnly, ArchetypeController.switchIsHighlighted.bind(ArchetypeController));
router.put('/:archetypeId/switchIsActive', ...adminOnly, ArchetypeController.switchIsActive.bind(ArchetypeController));

router.put('/switchAllToIsNotHighlighted', ...adminOnly, ArchetypeController.switchAllToIsNotHighlighted.bind(ArchetypeController));
router.put('/switchAllToIsUnactive', ...adminOnly, ArchetypeController.switchAllToIsUnactive.bind(ArchetypeController));
router.put('/resetPopularity', ...adminOnly, ArchetypeController.resetPopularity.bind(ArchetypeController));

router.delete('/:archetypeId', ...adminOnly, ArchetypeController.deleteArchetype.bind(ArchetypeController));

export default router;
