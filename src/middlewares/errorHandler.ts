import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { validationResult } from 'express-validator';

interface ErrorResponse {
    message: string;
    status: number;
    stack?: string;
    details?: Record<string, unknown>;
    multipleErrors?: boolean;
    errors?: Array<{ field?: string; message: string; value?: unknown }>;
}

interface SequelizeValidationErrorItem {
    type?: string;
    path?: string;
    message?: string;
}

export const ErrorHandler = (
    err: Error & { statusCode?: number; multipleErrors?: boolean; errors?: Array<{ field?: string; message: string; value?: unknown } | SequelizeValidationErrorItem> },
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Erreurs Sequelize (contraintes unique, not null, etc.)
    // if ((err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') && Array.isArray(err.errors) && err.errors.length > 0) {
    //     const first = err.errors[0] as SequelizeValidationErrorItem;
    //     const msg = first.type === 'unique violation'
    //         ? (first.path === 'email' ? 'Un utilisateur avec cet email existe déjà.' : first.path === 'username' ? 'Ce nom d\'utilisateur est déjà utilisé.' : first.message || 'Cette valeur est déjà utilisée.')
    //         : (first.message || err.message || 'Données invalides.');
    //     res.status(400).json({ message: msg, status: 400 });
    //     return;
    // }

    // // Gérer les erreurs de validation express-validator
    // if (err.name === 'ValidationError' || err.errors) {
    //     const errors = validationResult(req);
    //     if (!errors.isEmpty()) {
    //         const errorMessages = errors.array().map((validationError: any) => ({
    //             field: validationError.path || validationError.param,
    //             message: validationError.msg,
    //             value: validationError.value
    //         }));

    //         res.status(400).json({
    //             message: 'Erreur de validation des données',
    //             status: 400,
    //             errors: errorMessages
    //         });
    //         return;
    //     }
    // }

    const errStatus = err.statusCode || 500;
    const errMessage = err.message || 'Une erreur inconnue s\'est produite';
    const haveMultipleErrors = err.multipleErrors || false;

    // Logging structuré de l'erreur
    const errorContext: Record<string, unknown> = {
        statusCode: errStatus,
        message: errMessage,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id || null,
    };

    // Ajouter la stack trace en développement
    if (process.env.NODE_ENV === 'development' && err.stack) {
        errorContext.stack = err.stack;
    }

    // Logger l'erreur
    if (errStatus >= 500) {
        logger.logError('Erreur serveur', err, errorContext);
    } else {
        logger.logWarn('Erreur client', errorContext);
    }

    // Réponse au client
    const response: ErrorResponse = {
        message: errMessage,
        status: errStatus,
    };

    // Ajouter les détails en développement
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.details = errorContext;
    }

    if (haveMultipleErrors || err.errors) {
        response.multipleErrors = true;
        if (err.errors) {
            response.errors = err.errors.map((e: { field?: string; path?: string; message?: string; value?: unknown }) => ({
                field: e.field ?? e.path,
                message: e.message ?? 'Erreur de validation',
                value: e.value
            }));
        }
    }

    res.status(errStatus).json(response);
};
