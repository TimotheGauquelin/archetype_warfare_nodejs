import { CustomError } from '../errors/CustomError.js';
import Archetype from '../models/ArchetypeModel.js';
import DeckService from '../services/DeckService.js';

class DeckController {
    async getAllDecksByUserId(request, response, next) {

        const { userId } = request.params;

        try {

            const decks = await DeckService.getAllDecksByUserId(userId);
            return response.status(200).json(decks);

        } catch (error) {

            next(error);

        }
    }

    async getDeckById(request, response, next) {
        const { id } = request.params;
        try {
            const deck = await DeckService.getDeckById(id);
            return response.status(200).json(deck);
        } catch (error) {
            next(error);
        }
    }

    async createDeck(request, response, next) {

        const { id } = request.user;
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
            return response.status(201).json({
                success: true,
                message: 'Deck créé avec succès',

            });
        } catch (error) {
            next(error);
        }
    }

    async updateMyDeck(request, response, next) {
        const { id } = request.params;
        try {

            const userDeck = await DeckService.getDeckById(id);

            if (!userDeck) {
                throw new CustomError('Le deck n\'existe pas', 404);
            }

            if (userDeck.dataValues.user_id !== request.user.id) {
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

            const updatedDeck = await DeckService.updateMyDeck(request);
            return response.status(200).json({
                success: true,
                message: 'Deck mis à jour avec succès',
                data: updatedDeck
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteDeck(request, response, next) {
        const { id } = request.params;
        try {
            await DeckService.deleteDeck(id);
            return response.status(200).json({ message: 'Deck deleted successfully' });
        } catch (error) {
            next(error);
        }
    }


}

export default new DeckController();