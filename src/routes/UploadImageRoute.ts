import { Router, Request, Response, NextFunction } from 'express';
import UploadImageService from '../services/UploadImageService';
import UploadImageController from '../controllers/UploadImageController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const adminOnly = [authenticateToken, requireRole(['Admin'])];
const authenticated = [authenticateToken];

router.post('/upload', ...adminOnly, (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.uploadImageHandler(request, response, next);
});

router.get('/', ...adminOnly, (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.getAllImagesWithPaginationHandler(request, response, next);
});

/** Dossiers imbriqués (ex. picture_profile/default) via ?folder= — utilisateurs connectés (avatars profil) */
router.get('/by-folder', ...authenticated, (request: Request, response: Response, next: NextFunction) => {
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

router.get('/:folderName/all', ...adminOnly, (request: Request, response: Response, next: NextFunction) => {
    UploadImageService.getAllImagesFromFolderHandler(request, response, next);
});

router.delete('/:folderId/:publicId', ...adminOnly, (request: Request, response: Response, next: NextFunction) => {
    UploadImageController.deleteImage(request, response, next);
});

export default router;
