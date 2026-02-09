import multer from 'multer';
import path from 'path';

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'uploads/'); // Répertoire où les images seront stockées
    },
    filename: function (_req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom du fichier
    }
});

const upload = multer({ storage: storage });

export default upload;
