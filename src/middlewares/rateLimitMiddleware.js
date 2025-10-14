// import rateLimit from 'express-rate-limit';

// export const loginLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5, // 5 tentatives
//     message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// export const registerLimiter = rateLimit({
//     windowMs: 60 * 60 * 1000, // 1 heure
//     max: 3, // 3 inscriptions
//     message: 'Trop d\'inscriptions, réessayez dans 1 heure',
// }); 