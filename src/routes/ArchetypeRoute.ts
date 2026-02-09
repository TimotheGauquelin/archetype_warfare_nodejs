import { Router, Request, Response, NextFunction } from 'express';
import ArchetypeController from '../controllers/ArchetypeController';
import { validateSearchArchetypes, validateGetArchetypeById } from '../validators/archetypeValidators';
import { validateRequest } from '../middlewares/validation';

const router = Router();

// GET

router.get('/getFiveRandomHighlightedArchetypes', ArchetypeController.getFiveRandomHighlightedArchetypes.bind(ArchetypeController));
router.get('/getEightMostFamousArchetypes', ArchetypeController.getEightMostFamousArchetypes.bind(ArchetypeController));
router.get('/getEightMostRecentArchetypes', ArchetypeController.getEightMostRecentArchetypes.bind(ArchetypeController));
router.get('/search', validateRequest(validateSearchArchetypes), ArchetypeController.searchArchetypes.bind(ArchetypeController));
router.get('/random', ArchetypeController.getRandomArchetype.bind(ArchetypeController));
router.get('/allNames', ArchetypeController.getAllArchetypeNames.bind(ArchetypeController));
router.get('/:id', validateRequest(validateGetArchetypeById), ArchetypeController.getArchetypeById.bind(ArchetypeController));

// ADD

router.post('/', (request: Request, response: Response, next: NextFunction): void => {
    ArchetypeController.addArchetype(request, response, next).catch(next);
});

// PUT

router.put('/:archetypeId/update', (request: Request, response: Response, next: NextFunction): void => {
    ArchetypeController.updateArchetype(request, response, next).catch(next);
});
router.put('/:archetypeId/switchIsHighlighted', ArchetypeController.switchIsHighlighted.bind(ArchetypeController));
router.put('/:archetypeId/switchIsActive', ArchetypeController.switchIsActive.bind(ArchetypeController));

// PUT ALL

router.put('/switchAllToIsNotHighlighted', ArchetypeController.switchAllToIsNotHighlighted.bind(ArchetypeController));
router.put('/switchAllToIsUnactive', ArchetypeController.switchAllToIsUnactive.bind(ArchetypeController));
router.put('/resetPopularity', ArchetypeController.resetPopularity.bind(ArchetypeController));

// DELETE

router.delete('/:archetypeId', ArchetypeController.deleteArchetype.bind(ArchetypeController));

export default router;
