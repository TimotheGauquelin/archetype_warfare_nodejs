import { Request, Response, NextFunction } from 'express';
import UploadImageService from '../services/UploadImageService';

class UploadImageController {
    static async deleteImage(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const folderId = request.params.folderId;
            const publicId = request.params.publicId;

            if (!folderId || !publicId) {
                response.status(400).json({
                    success: false,
                    message: 'folderId et publicId sont requis dans l’URL'
                });
                return;
            }

            if (!folderId || !publicId) {
                response.status(400).json({
                    success: false,
                    message: 'folderId et publicId ne peuvent pas être vides'
                });
                return;
            }

            const fullPublicId = `${folderId}/${publicId}`;

            await UploadImageService.deleteImageFromCloudinary(fullPublicId);

            response.status(200).json({
                success: true,
                message: 'Image supprimée avec succès'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default UploadImageController;

