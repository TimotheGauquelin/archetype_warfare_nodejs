import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const opts = {
    overwrite: true,
    invalidate: true,
    resource_type: 'auto'
};

const uploadImage = async (imageData, folderName) => {
    const image = imageData;
    const folder = folderName;
    console.log(folder);

    if (!image) {
        throw new Error('Aucune image fournie');
    }

    try {
        const uploadOptions = {
            ...opts,
            folder: folder
        };

        console.log(uploadOptions);

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(image, uploadOptions, (error, result) => {
                if (result && result.secure_url) {
                    resolve(result);
                } else {
                    reject(error);
                }
            });
        });

        console.log("result", result.secure_url);

        return result.secure_url

    } catch (error) {
        console.error('Erreur upload Cloudinary:', error);
        throw new Error('Erreur lors de l\'upload de l\'image: ' + error.message);
    }
};

const getAllImages = async (request, response, next) => {
    try {
        const images = await new Promise((resolve, reject) => {
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
            return response.status(404).json({
                success: false,
                message: 'Aucune image trouvée'
            });
        }

        return response.status(200).json({
            success: true,
            data: images,
            count: images.length
        });

    } catch (error) {
        console.error('Erreur Cloudinary:', error);
        return response.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des images',
            error: error.message
        });
    }
};

const getAllImagesWithPagination = async (nextCursor = null) => {
    try {
        return new Promise((resolve, reject) => {
            const options = {
                resource_type: 'image',
                type: 'upload',
                max_results: 100 // Nombre d'images par page
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
    } catch (error) {
        throw new Error('Erreur lors de la récupération paginée des images: ' + error.message);
    }
};

const getAllImagesFromFolder = async (request, response, next) => {
    const folderName = request.params.folderName;

    if (!folderName) {
        return response.status(400).json({
            success: false,
            message: 'Nom du dossier requis'
        });
    }

    try {
        const images = await new Promise((resolve, reject) => {
            cloudinary.api.resources(
                {
                    resource_type: 'image',
                    type: 'upload',
                    prefix: folderName + '/', // Recherche dans le dossier spécifique
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
            return response.status(404).json({
                success: false,
                message: `Aucune image trouvée dans le dossier '${folderName}'`
            });
        }

        return response.status(200).json({
            success: true,
            message: `Images trouvées dans le dossier '${folderName}'`,
            data: images,
            folder: folderName,
            count: images.length
        });

    } catch (error) {
        console.error('Erreur Cloudinary:', error);
        return response.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des images du dossier',
            error: error.message
        });
    }
};

const deleteImageFromCloudinary = async (imageId) => {
    console.log("=== TENTATIVE DE SUPPRESSION ===");
    console.log("ImageId:", imageId);

    try {
        return new Promise((resolve, reject) => {
            // Options pour la suppression
            const deleteOptions = {
                resource_type: 'image', // Spécifier le type de ressource
                invalidate: true // Invalider le cache CDN
            };

            cloudinary.uploader.destroy(imageId, deleteOptions, (error, result) => {
                console.log("=== RÉSULTAT SUPPRESSION ===");
                console.log("Error:", error);
                console.log("Result:", result);

                if (error) {
                    console.error("Erreur Cloudinary:", error);
                    reject(error);
                } else {
                    console.log("Suppression réussie:", result);
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.error('Erreur catch:', error);
        throw new Error('Erreur lors de la suppression de l\'image: ' + error.message);
    }
};

export default { uploadImage, getAllImages, getAllImagesWithPagination, getAllImagesFromFolder, deleteImageFromCloudinary };