import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Trop de tentatives d\'inscriptions, réessayez dans 15 minutes',
});

export const requestNewPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Trop de tentatives de demande de création de nouveau mot de passe, réessayez dans 15 minutes',
})

/** Limite globale API (SPA = nombreuses requêtes) — 600 / 15 min par IP */
export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: 'Trop de requêtes, réessayez plus tard.',
});
