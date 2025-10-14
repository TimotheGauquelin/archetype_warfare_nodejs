import jwt from 'jsonwebtoken';
import { CustomError } from '../errors/CustomError.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        throw new CustomError('Token d\'accès requis', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        throw new CustomError('Token invalide', 403);
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            throw new CustomError('Accès refusé', 403);
        }

        const hasRole = req.user.roles.some(role => roles.includes(role));
        if (!hasRole) {
            throw new CustomError('Permissions insuffisantes', 403);
        }

        next();
    };
}; 