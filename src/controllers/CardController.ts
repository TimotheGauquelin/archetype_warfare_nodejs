import { Request, Response, NextFunction } from 'express';
import CardService from '../services/CardService';
import { getIntParam } from '../utils/request';

class CardController {
    async searchCards(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                name: request.query.name as string | undefined,
                card_type: request.query.card_type as string | undefined,
                level: request.query.level ? parseInt(request.query.level as string) : undefined,
                min_atk: request.query.min_atk ? parseInt(request.query.min_atk as string) : undefined,
                max_atk: request.query.max_atk ? parseInt(request.query.max_atk as string) : undefined,
                min_def: request.query.min_def ? parseInt(request.query.min_def as string) : undefined,
                max_def: request.query.max_def ? parseInt(request.query.max_def as string) : undefined,
                attribute: request.query.attribute as string | undefined,
                page: request.query.page ? parseInt(request.query.page as string) : 1,
                size: request.query.size ? parseInt(request.query.size as string) : 10
            };

            const cards = await CardService.searchCards(filters);
            response.status(200).json(cards);
        } catch (error) {
            next(error);
        }
    }

    async addCards(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const cards = request.body;

            if (!cards || !Array.isArray(cards) || cards.length === 0) {
                response.status(400).json({
                    success: false,
                    message: 'Les données des cartes sont requises et doivent être un tableau non vide'
                });
                return;
            }

            const result = await CardService.addCards(cards);

            const responseData = {
                success: true,
                message: `Traitement terminé. ${result.results.length} carte(s) ajoutée(s), ${result.errors.length} erreur(s)`,
                results: result.results,
                errors: result.errors
            };

            if (result.results.length === 0 && result.errors.length > 0) {
                response.status(400).json({
                    success: false,
                    message: 'Aucune carte n\'a pu être ajoutée',
                    errors: result.errors
                });
                return;
            }

            if (result.errors.length === 0) {
                response.status(201).json(responseData);
                return;
            }

            response.status(207).json(responseData);
        } catch (error) {
            next(error);
        }
    }

    async searchCardsByArchetypeBanlist(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const archetypeId = getIntParam(request.params.archetypeId);
            const filters = {
                name: request.query.name as string | undefined,
                card_type: request.query.card_type as string | undefined,
                level: request.query.level ? parseInt(request.query.level as string) : undefined,
                min_atk: request.query.min_atk ? parseInt(request.query.min_atk as string) : undefined,
                max_atk: request.query.max_atk ? parseInt(request.query.max_atk as string) : undefined,
                min_def: request.query.min_def ? parseInt(request.query.min_def as string) : undefined,
                max_def: request.query.max_def ? parseInt(request.query.max_def as string) : undefined,
                attribute: request.query.attribute as string | undefined,
                page: request.query.page ? parseInt(request.query.page as string) : 1,
                size: request.query.size ? parseInt(request.query.size as string) : 10
            };

            const cards = await CardService.searchCardsByArchetypeBanlist(archetypeId, filters);
            response.status(200).json(cards);
        } catch (error) {
            next(error);
        }
    }
}

export default new CardController();
