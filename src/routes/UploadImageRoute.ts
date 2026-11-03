import { Router, Request, Response, NextFunction } from 'express';
import UploadImageService from '../services/UploadImageService';
import UploadImageController from '../controllers/UploadImageController';

const router = Router();

router.post('/upload', (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.uploadImageHandler(request, response, next);
});

router.get('/', (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.getAllImagesWithPaginationHandler(request, response, next);
});

/** Dossiers imbriqués (ex. picture_profile/default) via ?folder= */
router.get('/by-folder', (request: Request, response: Response, next: NextFunction) => {
    const folder = String(request.query.folder ?? '').trim();
    if (!folder) {
        response.status(400).json({
            success: false,
            message: 'Paramètre folder requis',
        });
        return;
    }
    (request as Request & { cloudinaryFolder?: string }).cloudinaryFolder = folder;
    UploadImageService.getAllImagesFromFolderHandler(request, response, next);
});

router.get('/:folderName/all', (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.getAllImagesFromFolderHandler(request, response, next);
});

router.delete('/:folderId/:publicId', (request: Request, response: Response, next: NextFunction) => {
    UploadImageController.deleteImage(request, response, next);
});

export default router;
