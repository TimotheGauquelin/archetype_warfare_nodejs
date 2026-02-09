import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { CustomError } from '../errors/CustomError';
import envVars from '../config/envValidation';
import logger from '../utils/logger';

interface DecodedToken extends JwtPayload {
    id: number;
    email: string;
    username: string;
    roles: string[];
}

export const authenticateToken = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.logWarn('Tentative d\'accès sans token', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        throw new CustomError('Token d\'accès requis', 401);
    }

    try {
        const decoded = jwt.verify(token, envVars.JWT_SECRET) as DecodedToken;
        req.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            roles: decoded.roles
        };
        logger.logDebug('Token authentifié avec succès', {
            userId: decoded.id,
            path: req.path
        });
        next();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.logWarn('Token invalide', {
            path: req.path,
            method: req.method,
            error: errorMessage
        });
        throw new CustomError('Token invalide', 403);
    }
};

/**
 * Middleware pour vérifier que l'utilisateur a les rôles requis
 * @param requiredRoles - Tableau des rôles requis
 * @returns Middleware Express
 */
export const requireRole = (requiredRoles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new CustomError('Utilisateur non authentifié', 401);
            }

            if (!req.user.roles || !Array.isArray(req.user.roles)) {
                logger.logWarn('Tentative d\'accès sans rôles', {
                    userId: req.user.id,
                    path: req.path
                });
                throw new CustomError('Aucun rôle attribué à l\'utilisateur', 403);
            }

            const hasRequiredRole = req.user.roles.some(userRole =>
                requiredRoles.includes(userRole)
            );

            if (!hasRequiredRole) {
                logger.logWarn('Permissions insuffisantes', {
                    userId: req.user.id,
                    userRoles: req.user.roles,
                    requiredRoles,
                    path: req.path
                });
                throw new CustomError('Permissions insuffisantes', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
