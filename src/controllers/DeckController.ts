import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/CustomError';
import Archetype from '../models/ArchetypeModel';
import Deck from '../models/DeckModel';
import DeckService from '../services/DeckService';
import { getUuidParam } from '../utils/request';

class DeckController {
    async getAllDecksByUserId(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUuidParam(request.params.userId);
            const isPlayableParam = request.query.is_playable;
            const isActiveParam = request.query.is_active;
            let isPlayable: boolean | undefined;
            let isActive: boolean | undefined;
            if (isPlayableParam === 'true') isPlayable = true
            else if (isPlayableParam === 'false') isPlayable = false;
            if (isActiveParam === 'true') isActive = true;
            else if (isActiveParam === 'false') isActive = false;
            const decks = await DeckService.getAllDecksByUserId(userId, isPlayable, isActive);

            response.status(200).json(decks);
        } catch (error) {
            next(error);
        }
    }

    async getDeckById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const deck = await DeckService.getDeckById(id);
            if (!deck) {
                throw new CustomError('Deck non trouvé', 404);
            }
            response.status(200).json(deck);
        } catch (error) {
            next(error);
        }
    }

    async createDeck(request: Request, response: Response, next: NextFunction): Promise<void> {
        const { id } = request.user!;
        const { label, archetype_id } = request.body;

        try {
            if (!label || !label.trim()) {
                throw new CustomError('Le label du deck est obligatoire', 400);
            }

            if (archetype_id) {
                const archetype = await Archetype.findByPk(archetype_id);
                if (!archetype) {
                    throw new CustomError('L\'archetype spécifié n\'existe pas', 404);
                }
            }

            await DeckService.createDeck(request.body, id);
            response.status(201).json({
                success: true,
                message: 'Deck créé avec succès',
            });
        } catch (error) {
            next(error);
        }
    }

    async updateMyDeck(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const userDeck = await DeckService.getDeckById(id);

            if (!userDeck) {
                throw new CustomError('Le deck n\'existe pas', 404);
            }

            if (userDeck.user_id !== request.user!.id) {
                throw new CustomError('Vous ne pouvez pas mettre à jour un deck qui ne vous appartient pas', 403);
            }

            if (!request.body.label) {
                throw new CustomError('Le label du deck est obligatoire', 400);
            }

            if (request.body.archetype_id) {
                const archetype = await Archetype.findByPk(request.body.archetype_id);
                if (!archetype) {
                    throw new CustomError('L\'archetype spécifié n\'existe pas', 404);
                }
            }

            const updatedDeck = await DeckService.updateMyDeck(id, request.body, userDeck);
            response.status(200).json({
                success: true,
                message: 'Deck mis à jour avec succès',
                data: updatedDeck
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteMyDeck(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const deck = await Deck.findByPk(id);
            if (!deck) {
                throw new CustomError('Le deck n\'existe pas', 404);
            }

            if (deck.user_id !== request.user!.id) {
                throw new CustomError('Vous ne pouvez pas supprimer un deck qui ne vous appartient pas', 403);
            }

            await DeckService.deleteMyDeck(id);
            response.status(200).json({ message: 'Deck supprimé avec succès' });
        } catch (error) {
            next(error);
        }
    }
}

export default new DeckController();
