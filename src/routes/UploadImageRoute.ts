import { Router, Request, Response, NextFunction } from 'express';
import UploadImageService from '../services/UploadImageService';

const router = Router();

router.post('/upload', (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.uploadImageHandler(request, response, next);
});

router.get('/', (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.getAllImagesWithPaginationHandler(request, response, next);
});

router.get('/:folderName/all', (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.getAllImagesFromFolderHandler(request, response, next);
});

export default router;
