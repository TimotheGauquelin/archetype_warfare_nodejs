import { body, query, param, ValidationChain } from 'express-validator';

/**
 * Validateurs pour les routes d'archétypes
 */

// GET /search
export const validateSearchArchetypes: ValidationChain[] = [
    query('name').optional().isString().trim().escape(),
    query('era').optional().isInt({ min: 1 }),
    query('type').optional().isString().trim().escape(),
    query('attribute').optional().isString().trim().escape(),
    query('summonmechanic').optional().isString().trim().escape(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('size').optional().isInt({ min: 1, max: 100 }).toInt(),
];

// GET /:id — id peut être un entier (ID) ou une chaîne (slug)
export const validateGetArchetypeById: ValidationChain[] = [
    param('id').notEmpty().withMessage('L\'ID ou le slug est requis').isString().trim(),
];

// POST /
export const validateCreateArchetype: ValidationChain[] = [
    body('name')
        .notEmpty().withMessage('Le nom est requis')
        .isString().trim()
        .isLength({ min: 1, max: 50 }).withMessage('Le nom doit contenir entre 1 et 50 caractères'),
    body('slug').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('main_info').optional().isString(),
    body('slider_info').optional().isString(),
    body('in_tcg_date').isISO8601().withMessage('La date TCG doit être au format ISO 8601'),
    body('in_aw_date').isISO8601().withMessage('La date AW doit être au format ISO 8601'),
    body('era_id').isInt({ min: 1 }).withMessage('L\'ID de l\'ère doit être un nombre entier positif'),
    body('is_highlighted').optional().isBoolean(),
    body('is_active').optional().isBoolean(),
    body('slider_img_url').optional().isURL().withMessage('L\'URL de l\'image slider doit être valide'),
    body('card_img_url').optional().isURL().withMessage('L\'URL de l\'image de carte doit être valide'),
];

// PUT /:archetypeId/update — archetypeId peut être ID ou slug
export const validateUpdateArchetype: ValidationChain[] = [
    param('archetypeId').notEmpty().withMessage('L\'ID ou le slug de l\'archétype est requis').isString().trim(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('slug').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('main_info').optional().isString(),
    body('slider_info').optional().isString(),
    body('in_tcg_date').optional().isISO8601(),
    body('in_aw_date').optional().isISO8601(),
    body('era_id').optional().isInt({ min: 1 }),
    body('is_highlighted').optional().isBoolean(),
    body('is_active').optional().isBoolean(),
    body('slider_img_url').optional().isURL(),
    body('card_img_url').optional().isURL(),
];

// DELETE /:archetypeId — archetypeId peut être ID ou slug
export const validateDeleteArchetype: ValidationChain[] = [
    param('archetypeId').notEmpty().withMessage('L\'ID ou le slug de l\'archétype est requis').isString().trim(),
];
