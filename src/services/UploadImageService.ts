import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import envVars from '../config/envValidation';
import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

cloudinary.config({
    cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY_API_SECRET
});

const opts = {
    overwrite: true,
    invalidate: true,
    resource_type: 'auto' as const
};

interface CloudinaryResource {
    public_id: string;
    secure_url: string;
    [key: string]: unknown;
}

interface PaginatedResources {
    resources: CloudinaryResource[];
    next_cursor?: string;
    total_count: number;
}

class UploadImageService {
    static async uploadImageHandler(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { imageData, folderName } = request.body;
            if (!imageData || !folderName) {
                response.status(400).json({
                    success: false,
                    message: 'imageData et folderName sont requis'
                });
                return;
            }
            const url = await UploadImageService.uploadImage(imageData, folderName);
            response.status(200).json({
                success: true,
                url
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllImagesWithPaginationHandler(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const nextCursor = request.query.cursor as string | null || null;
            const result = await UploadImageService.getAllImagesWithPagination(nextCursor);
            response.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllImagesFromFolderHandler(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            await UploadImageService.getAllImagesFromFolder(request, response);
        } catch (error) {
            next(error);
        }
    }

    static async uploadImage(imageData: string, folderName: string): Promise<string> {
        if (!imageData) {
            throw new Error('Aucune image fournie');
        }

        try {
            const uploadOptions = {
                ...opts,
                folder: folderName
            };

            logger.logDebug('Upload d\'image en cours', { folder: folderName });

            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                cloudinary.uploader.upload(imageData, uploadOptions, (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (result && result.secure_url) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
            });

            logger.logInfo('Image uploadée avec succès', {
                folder: folderName,
                url: result.secure_url,
                publicId: result.public_id
            });

            return result.secure_url;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.logError('Erreur upload Cloudinary', error instanceof Error ? error : null, { folder: folderName });
            throw new Error('Erreur lors de l\'upload de l\'image: ' + errorMessage);
        }
    }

    static async getAllImages(_request: Request, response: Response): Promise<void> {
        try {
            const images = await new Promise<CloudinaryResource[]>((resolve, reject) => {
                cloudinary.api.resources(
                    {
                        resource_type: 'image',
                        type: 'upload',
                        max_results: 500
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result.resources);
                        }
                    }
                );
            });

            if (!images || images.length === 0) {
                response.status(404).json({
                    success: false,
                    message: 'Aucune image trouvée'
                });
                return;
            }

            response.status(200).json({
                success: true,
                data: images,
                count: images.length
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.logError('Erreur Cloudinary lors de la récupération des images', error instanceof Error ? error : null);
            response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des images',
                error: errorMessage
            });
        }
    }

    static async getAllImagesWithPagination(nextCursor: string | null = null): Promise<PaginatedResources> {
        return new Promise<PaginatedResources>((resolve, reject) => {
            const options: {
                resource_type: string;
                type: string;
                max_results: number;
                next_cursor?: string;
            } = {
                resource_type: 'image',
                type: 'upload',
                max_results: 100
            };

            if (nextCursor) {
                options.next_cursor = nextCursor;
            }

            cloudinary.api.resources(options, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        resources: result.resources,
                        next_cursor: result.next_cursor,
                        total_count: result.total_count
                    });
                }
            });
        });
    }

    static async getAllImagesFromFolder(request: Request, response: Response): Promise<void> {
        const folderName = request.params.folderName;

        if (!folderName) {
            response.status(400).json({
                success: false,
                message: 'Nom du dossier requis'
            });
            return;
        }

        try {
            const images = await new Promise<CloudinaryResource[]>((resolve, reject) => {
                cloudinary.api.resources(
                    {
                        resource_type: 'image',
                        type: 'upload',
                        prefix: folderName + '/',
                        max_results: 500
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result.resources);
                        }
                    }
                );
            });

            if (!images || images.length === 0) {
                response.status(404).json({
                    success: false,
                    message: `Aucune image trouvée dans le dossier '${folderName}'`
                });
                return;
            }

            response.status(200).json({
                success: true,
                message: `Images trouvées dans le dossier '${folderName}'`,
                data: images,
                folder: folderName,
                count: images.length
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.logError('Erreur Cloudinary lors de la récupération des images du dossier', error instanceof Error ? error : null, {
                folderName
            });
            response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des images du dossier',
                error: errorMessage
            });
        }
    }

    static async deleteImageFromCloudinary(imageId: string): Promise<unknown> {
        logger.logDebug('Tentative de suppression d\'image', { imageId });

        return new Promise((resolve, reject) => {
            const deleteOptions = {
                resource_type: 'image' as const,
                invalidate: true
            };

            cloudinary.uploader.destroy(imageId, deleteOptions, (error, result) => {
                if (error) {
                    logger.logError('Erreur Cloudinary lors de la suppression', error instanceof Error ? error : null, { imageId });
                    reject(error);
                } else {
                    logger.logInfo('Image supprimée avec succès', { imageId, result });
                    resolve(result);
                }
            });
        });
    }
}

export default UploadImageService;
