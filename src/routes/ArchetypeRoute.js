import { Router } from 'express';
import ArchetypeController from '../controllers/ArchetypeController.js';
const router = Router();

// GET

router.get('/getFiveRandomHighlightedArchetypes', (request, response) => ArchetypeController.getFiveRandomHighlightedArchetypes(request, response))
router.get('/getFiveMostFamousArchetypes', (request, response) => ArchetypeController.getFiveMostFamousArchetypes(request, response))
router.get('/getEightMostRecentArchetypes', (request, response) => ArchetypeController.getEightMostRecentArchetypes(request, response))
router.get('/search', (request, response) => ArchetypeController.searchArchetypes(request, response));
router.get('/:id', (request, response) => ArchetypeController.getArchetypeById(request, response))
// ADD

router.post('/', (request, response) => ArchetypeController.addArchetype(request, response));

// PUT

router.put('/:archetypeId/update', (request, response) => ArchetypeController.updateArchetype(request, response));
router.put('/:archetypeId/switchIsHighlighted', (request, response) => ArchetypeController.switchIsHighlighted(request, response));
router.put('/:archetypeId/switchIsActive', (request, response) => ArchetypeController.switchIsActive(request, response));

// PUT ALL

router.put('/switchAllToIsNotHighlighted', (request, response) => ArchetypeController.switchAllToIsNotHighlighted(request, response));
router.put('/switchAllToIsUnactive', (request, response) => ArchetypeController.switchAllToIsUnactive(request, response));
router.put('/resetPopularity', (request, response) => ArchetypeController.resetPopularity(request, response));

// DELETE

router.delete('/:archetypeId', (request, response) => ArchetypeController.deleteArchetype(request, response));

export default router;