import jwt from 'jsonwebtoken';
import { CustomError } from '../errors/CustomError.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

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

/**
 * @param {string[]} requiredRoles
 * @returns {Function}
 */
export const requireRole = (requiredRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new CustomError('Utilisateur non authentifié', 401);
            }

            if (!req.user.roles || !Array.isArray(req.user.roles)) {
                throw new CustomError('Aucun rôle attribué à l\'utilisateur', 403);
            }

            const hasRequiredRole = req.user.roles.some(userRole =>
                requiredRoles.includes(userRole)
            );

            if (!hasRequiredRole) {
                throw new CustomError('Permissions insuffisantes', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};