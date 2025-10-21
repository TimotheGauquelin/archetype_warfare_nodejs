/**
 * Extract the image ID from the image URL
 * @param {string} imageUrl - The image URL beginning with "https://res.cloudinary.com/" and ending with the extension
 * @example "https://res.cloudinary.com/dqfuwqmql/image/upload/v1760875698/jumbotron_archetypes/y5imsklkvepijxpkewzy.png"
 * @returns {string|null} The image ID or null if the URL is invalid
 * @example "/jumbotron_archetypes/y5imsklkvepijxpkewzy"
 */
export const extractImageIdFromUrl = (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return null;
    }

    try {
        const regex = /\/upload\/[^\/]+\/(.+)$/;
        const match = imageUrl.match(regex);

        if (!match) {
            return null;
        }

        const fullPath = match[1];

        const imageIdWithoutExtension = fullPath.replace(/\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)$/i, '');

        return imageIdWithoutExtension

    } catch (error) {
        console.error('Erreur lors de l\'extraction de l\'ID:', error);
        return null;
    }
};