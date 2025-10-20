import { Router } from 'express';
import UploadImageService from '../services/UploadImageService.js';
const router = Router();

router.post('/upload', (request, response, next) => {
    UploadImageService.uploadImage(request, response, next);
});

router.get('/', (request, response, next) => {
    UploadImageService.getAllImagesWithPagination(request, response, next);
});

router.get('/:folderName/all', (request, response, next) => {
    UploadImageService.getAllImagesFromFolder(request, response, next);
});

export default router;