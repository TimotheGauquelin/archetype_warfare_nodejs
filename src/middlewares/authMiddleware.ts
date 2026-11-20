import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { CustomError } from '../errors/CustomError';
import envVars from '../config/envValidation';
import logger from '../utils/logger';
import { User, Role } from '../models/relations';
import { AUTH_COOKIE_NAME } from '../utils/authCookie';

interface DecodedToken extends JwtPayload {
    id: string;
    email: string;
    username: string;
    roles: string[];
}

function extractAccessToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    const bearer = authHeader && authHeader.split(' ')[1];
    if (bearer) return bearer;

    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    if (typeof cookieToken === 'string' && cookieToken.trim()) {
        return cookieToken.trim();
    }
    return null;
}

async function loadUserFromToken(token: string): Promise<{
    id: string;
    email: string;
    username: string | null;
    roles: string[];
}> {
    const decoded = jwt.verify(token, envVars.JWT_SECRET) as DecodedToken;

    const user = await User.findByPk(decoded.id, {
        include: [{ model: Role, as: 'roles' }],
    });

    if (!user) {
        throw new CustomError('Utilisateur introuvable', 401);
    }
    if (user.is_banned) {
        throw new CustomError('Votre compte est banni', 403);
    }
    if (!user.is_active) {
        throw new CustomError('Votre compte n\'est pas actif', 403);
    }

    const roles = ((user as User & { roles?: Role[] }).roles || []).map((role) => role.label);

    return {
        id: String(user.id),
        email: user.email || decoded.email || '',
        username: user.username,
        roles,
    };
}

export const authenticateToken = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    const token = extractAccessToken(req);

    if (!token) {
        logger.logWarn('Tentative d\'accès sans token', {
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        next(new CustomError('Token d\'accès requis', 401));
        return;
    }

    try {
        req.user = await loadUserFromToken(token);
        logger.logDebug('Token authentifié avec succès', {
            userId: req.user.id,
            path: req.path,
        });
        next();
    } catch (error) {
        if (error instanceof CustomError) {
            next(error);
            return;
        }
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.logWarn('Token invalide', {
            path: req.path,
            method: req.method,
            error: errorMessage,
        });
        next(new CustomError('Token invalide', 403));
    }
};

/** Auth optionnelle : attache req.user si un JWT valide est présent, sinon continue. */
export const optionalAuthenticateToken = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    const token = extractAccessToken(req);
    if (!token) {
        next();
        return;
    }
    try {
        req.user = await loadUserFromToken(token);
    } catch {
        // ignore invalid token for optional routes
    }
    next();
};

export const requireRole = (requiredRoles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new CustomError('Utilisateur non authentifié', 401);
            }

            if (!req.user.roles || !Array.isArray(req.user.roles)) {
                logger.logWarn('Tentative d\'accès sans rôles', {
                    userId: req.user.id,
                    path: req.path,
                });
                throw new CustomError('Aucun rôle attribué à l\'utilisateur', 403);
            }

            const hasRequiredRole = req.user.roles.some((userRole) =>
                requiredRoles.includes(userRole)
            );

            if (!hasRequiredRole) {
                logger.logWarn('Permissions insuffisantes', {
                    userId: req.user.id,
                    userRoles: req.user.roles,
                    requiredRoles,
                    path: req.path,
                });
                throw new CustomError('Permissions insuffisantes', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
