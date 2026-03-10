import { Request, Response, NextFunction } from 'express';
import Banlist from '../models/BanlistModel';
import BanlistService from '../services/BanlistService';
import { getIntParam } from '../utils/request';

class BanlistController {
    async getCurrentBanlist(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const includeArchetypeCardsParam = request.query.include_archetype_cards;
            const includeArchetypeCards = includeArchetypeCardsParam === undefined
                ? true
                : includeArchetypeCardsParam === 'true' || includeArchetypeCardsParam === '1';
            const banlist = await BanlistService.getCurrentBanlist(includeArchetypeCards);
            response.json(banlist);
        } catch (error) {
            next(error);
        }
    }

    async getAllBanlists(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const banlists = await BanlistService.getAllBanlists();
            response.json(banlists);
        } catch (error) {
            next(error);
        }
    }

    async getBanlistById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.id);
            const showArchetypeCardsParam = request.query.showArchetypeCards;
            const showArchetypeCards = showArchetypeCardsParam === undefined
                ? false
                : showArchetypeCardsParam === 'true' || showArchetypeCardsParam === '1';

            const banlist = await BanlistService.getBanlistById(id, showArchetypeCards);
            response.status(200).json(banlist);
        } catch (error) {
            next(error);
        }
    }

    async addBanlist(request: Request, response: Response, next: NextFunction): Promise<void> {
        const banlistData = request.body;
        try {
            if (!banlistData.label || !banlistData.release_date || !banlistData.description) {
                response.status(400).json({
                    message: 'Les champs label, release_date et description sont obligatoires'
                });
                return;
            }

            const alreadyExistBanlist = await Banlist.findOne({ where: { label: banlistData.label } });
            if (alreadyExistBanlist) {
                response.status(400).json({
                    message: 'Une banlist avec ce label existe déjà'
                });
                return;
            }

            await BanlistService.addBanlist(banlistData);
            response.status(201).json({ success: true, message: 'Banlist créé !' });
        } catch (error) {
            next(error);
        }
    }

    async updateBanlist(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.id);
            const banlistData = request.body;

            const databaseBanlist = await Banlist.findByPk(id);
            if (!databaseBanlist) {
                response.status(404).json({ message: 'Banlist non trouvée' });
                return;
            }

            await BanlistService.updateBanlist(id, databaseBanlist, banlistData);
            response.status(200).json({
                message: 'Banlist mise à jour avec succès',
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteBanlist(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getIntParam(request.params.id);
            const existingBanlist = await Banlist.findByPk(id);
            if (!existingBanlist) {
                response.status(404).json({ message: 'Aucune banlist trouvée' });
                return;
            }

            await BanlistService.deleteBanlist(id);
            response.status(200).json({ message: 'Banlist supprimée avec succès' });
        } catch (error) {
            next(error);
        }
    }
}

export default new BanlistController();
