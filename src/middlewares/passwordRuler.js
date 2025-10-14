import { CustomError } from '../errors/CustomError.js';

export const passwordRuler = (req, res, next) => {
    const { password } = req.body;
    const errors = [];

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
        throw new CustomError(errorMessage, 400);
    }

    next();
};

export default passwordRuler;