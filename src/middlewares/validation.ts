import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { CustomError } from '../errors/CustomError';
import logger from '../utils/logger';

interface ValidationError {
    field?: string;
    message: string;
    value?: unknown;
}

/**
 * Middleware to validate the results of express-validator
 * Must be used after the express-validator validators
 */
export const validate = (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages: ValidationError[] = errors.array().map((validationError: any) => ({
            field: validationError.path || validationError.param,
            message: validationError.msg,
            value: validationError.value
        }));

        logger.logWarn('Erreur de validation', {
            errors: errorMessages,
            path: req.path,
            method: req.method
        });

        const validationError = new CustomError('Erreur de validation des données', 400, true);
        validationError.errors = errorMessages;
        next(validationError);
        return;
    }

    next();
};

/**
 * Wrapper to simplify the using of validators
 * @param validators - Array of validators
 * @returns An array with validators and middleware of validation
 */
export const validateRequest = (validators: ValidationChain[]): (ValidationChain | typeof validate)[] => {
    return [...validators, validate];
};
