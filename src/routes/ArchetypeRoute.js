import { Router } from 'express';
import ArchetypeController from '../controllers/ArchetypeController.js';
const router = Router();

// GET

router.get('/getFiveRandomHighlightedArchetypes', (request, response, next) => ArchetypeController.getFiveRandomHighlightedArchetypes(request, response, next));
router.get('/getFiveMostFamousArchetypes', (request, response, next) => ArchetypeController.getFiveMostFamousArchetypes(request, response, next));
router.get('/getEightMostRecentArchetypes', (request, response, next) => ArchetypeController.getEightMostRecentArchetypes(request, response, next));
router.get('/search', (request, response, next) => ArchetypeController.searchArchetypes(request, response, next));
router.get('/random', (request, response, next) => ArchetypeController.getRandomArchetype(request, response, next));
router.get('/:id', (request, response, next) => ArchetypeController.getArchetypeById(request, response, next));
// ADD

router.post('/', (request, response, next) => ArchetypeController.addArchetype(request, response, next));

// PUT

router.put('/:archetypeId/update', (request, response) => ArchetypeController.updateArchetype(request, response));
router.put('/:archetypeId/switchIsHighlighted', (request, response, next) => ArchetypeController.switchIsHighlighted(request, response, next));
router.put('/:archetypeId/switchIsActive', (request, response, next) => ArchetypeController.switchIsActive(request, response, next));

// PUT ALL

router.put('/switchAllToIsNotHighlighted', (request, response, next) => ArchetypeController.switchAllToIsNotHighlighted(request, response, next));
router.put('/switchAllToIsUnactive', (request, response, next) => ArchetypeController.switchAllToIsUnactive(request, response, next));
router.put('/resetPopularity', (request, response, next) => ArchetypeController.resetPopularity(request, response, next));

// DELETE

router.delete('/:archetypeId', (request, response, next) => ArchetypeController.deleteArchetype(request, response, next));

export default router;