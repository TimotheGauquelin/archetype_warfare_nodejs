declare module 'express-validator' {
    import { RequestHandler } from 'express';

    export interface ValidationChain extends RequestHandler {
        // Méthodes de validation de base
        optional(options?: { nullable?: boolean; checkFalsy?: boolean }): ValidationChain;
        notEmpty(): ValidationChain;
        isEmpty(): ValidationChain;
        
        // Méthodes de type
        isString(): ValidationChain;
        isInt(options?: { min?: number; max?: number }): ValidationChain;
        isBoolean(): ValidationChain;
        isURL(options?: { protocols?: string[]; require_tld?: boolean; require_protocol?: boolean }): ValidationChain;
        isISO8601(): ValidationChain;
        isEmail(): ValidationChain;
        isNumeric(): ValidationChain;
        isArray(): ValidationChain;
        isObject(): ValidationChain;
        
        // Méthodes de transformation
        trim(): ValidationChain;
        escape(): ValidationChain;
        toInt(): ValidationChain;
        toFloat(): ValidationChain;
        toBoolean(): ValidationChain;
        toDate(): ValidationChain;
        toLowerCase(): ValidationChain;
        toUpperCase(): ValidationChain;
        
        // Méthodes de validation de longueur
        isLength(options: { min?: number; max?: number }): ValidationChain;
        
        // Méthodes de validation personnalisées
        custom(validator: (value: any) => boolean | Promise<boolean>): ValidationChain;
        withMessage(message: string): ValidationChain;
        
        // Méthodes de normalisation
        normalizeEmail(options?: { all_lowercase?: boolean }): ValidationChain;
    }

    export function body(field?: string): ValidationChain;
    export function query(field?: string): ValidationChain;
    export function param(field?: string): ValidationChain;
    export function validationResult(req: any): {
        isEmpty(): boolean;
        array(): Array<{
            path?: string;
            param?: string;
            msg: string;
            value?: unknown;
        }>;
    };
}
