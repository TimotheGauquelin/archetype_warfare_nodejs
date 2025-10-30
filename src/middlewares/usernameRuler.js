import { CustomError } from '../errors/CustomError.js';

const forbiddenWords = ['bite', 'enculé', 'connard', 'salaud', 'bâtard', 'putain', 'merde',
    'trou du cul', 'couillon', 'connasse', 'fils de pute', 'sale con', 'pétasse', 'couille',
    'enflure', 'tête de noeud', 'abruti', 'tocard', 'crétin', 'imbécile',
    'tapette', 'clochard', 'dick', 'bastard', 'shithead', 'cunt', 'asshole',
    'prick', 'bitch', 'motherfucker', 'son of a bitch', 'douchebag', 'idiot',
    'wanker', 'twat', 'fucker', 'cuntface', 'loser', 'hellspawn', 'shitbag',
    'slimeball', 'dickhead'];

export const usernameRuler = (req, res, next) => {
    const { username } = req.body;
    const errors = [];

    if (!username) {
        throw new CustomError('Un nom d\'utilisateur est requis.', 400);
    }

    if (username.length < 3) {
        errors.push('Au moins 3 caractères.');
    }

    if (username.length > 30) {
        errors.push('Maximum 30 caractères.');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Uniquement des lettres, des chiffres et des underscores.');
    }

    const letterCount = (username.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 3) {
        errors.push('Le pseudo doit comporter au moins 3 lettres.');
    }

    const lowerCaseValue = username.toLowerCase();
    for (const word of forbiddenWords) {
        if (lowerCaseValue.includes(word.replace(/\s+/g, '').replace(/[0-9]/g, ''))) {
            errors.push('Le pseudo contient un mot inapproprié. Veuillez le modifier.');
        }
    }

    if (errors.length > 0) {
        const errorMessage = `Le nom d'utilisateur doit répondre aux critères suivants :\n- ${errors.join('\n- ')}`;
        throw new CustomError(errorMessage, 400, true);
    }

    next();
};

export default usernameRuler;