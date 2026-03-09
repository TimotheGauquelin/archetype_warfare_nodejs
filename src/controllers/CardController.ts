import { Request, Response, NextFunction } from 'express';
import CardService from '../services/CardService';
import ArchetypeService from '../services/ArchetypeService';

class CardController {
    async getCardDetail(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
            if (!id || typeof id !== 'string') {
                response.status(400).json({ success: false, message: 'ID de la carte requis' });
                return;
            }
            const card = await CardService.getCardById(id);
            if (!card) {
                response.status(404).json({ success: false, message: 'Carte introuvable' });
                return;
            }
            response.status(200).json(card);
        } catch (error) {
            next(error);
        }
    }

    /** Mise à jour manuelle des détails d'une carte (met manual_update à true). */
    async updateCardDetail(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
            if (!id || typeof id !== 'string') {
                response.status(400).json({ success: false, message: 'ID de la carte requis' });
                return;
            }
            const body = request.body as Record<string, unknown>;
            const data = {
                name: body.name as string | undefined,
                description: body.description !== undefined ? (body.description as string | null) : undefined,
                img_url: body.img_url !== undefined ? (body.img_url as string | null) : undefined,
                level: body.level !== undefined ? (body.level as number | null) : undefined,
                atk: body.atk !== undefined ? (body.atk as number | null) : undefined,
                def: body.def !== undefined ? (body.def as number | null) : undefined,
                attribute: body.attribute !== undefined ? (body.attribute as string | null) : undefined,
                card_type: body.card_type !== undefined ? (body.card_type as string | null) : undefined
            };
            const card = await CardService.updateCard(id, data);
            if (!card) {
                response.status(404).json({ success: false, message: 'Carte introuvable' });
                return;
            }
            response.status(200).json(card);
        } catch (error) {
            next(error);
        }
    }

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

            const createdCount = result.results.filter(r => r.created).length;
            const updatedCount = result.results.filter(r => r.updated).length;
            const skippedCount = result.results.filter(r => r.skipped).length;
            const parts: string[] = [];
            if (createdCount > 0) parts.push(`${createdCount} carte(s) créée(s)`);
            if (updatedCount > 0) parts.push(`${updatedCount} mise(s) à jour`);
            if (skippedCount > 0) parts.push(`${skippedCount} non modifiée(s) (manual_update)`);
            const summary = parts.length > 0 ? parts.join(', ') : 'Aucune carte traitée';
            const message = result.errors.length > 0
                ? `Traitement terminé. ${summary}, ${result.errors.length} erreur(s)`
                : `Traitement terminé. ${summary}.`;

            const responseData = {
                success: true,
                message,
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
            const archetypeIdParam = Array.isArray(request.params.archetypeId) ? request.params.archetypeId[0] : request.params.archetypeId;
            if (!archetypeIdParam || typeof archetypeIdParam !== 'string') {
                response.status(400).json({ success: false, message: 'ID ou slug de l\'archétype requis' });
                return;
            }
            const archetypeId = await ArchetypeService.resolveArchetypeId(archetypeIdParam);
            if (archetypeId == null) {
                response.status(404).json({ success: false, message: 'Archétype introuvable' });
                return;
            }
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
