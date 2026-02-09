import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/CustomError';

export const passwordRuler = (req: Request, _res: Response, next: NextFunction): void => {
    const { password } = req.body;
    const errors: string[] = [];

    if (!password) {
        throw new CustomError('Un mot de passe est requis.', 400);
    }

    if (password.length < 8) {
        errors.push('Au moins 8 caractères.');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Une lettre majuscule.');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Une lettre minuscule.');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Un chiffre.');
    }

    if (!/[@$!%*?&^#_+\-=\[\]{}|\\:;,.<>~]/.test(password)) {
        errors.push('Un caractère spécial parmi : @ $ ! % * ? & ^ # _ + - = [ ] { } | \\ : ; , . < > ~.');
    }

    if (errors.length > 0) {
        const errorMessage = `Le mot de passe doit répondre aux critères suivants :\n- ${errors.join('\n- ')}`;
        throw new CustomError(errorMessage, 400, true);
    }

    next();
};

export default passwordRuler;
