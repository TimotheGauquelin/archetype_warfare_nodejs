import Banlist from '../models/BanlistModel.js';
import BanlistService from '../services/BanlistService.js';

class BanlistController {
    async getCurrentBanlist(request, result) {
        try {
            const banlist = await BanlistService.getCurrentBanlist(request, result);
            return result.json(banlist);
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }

    async getAllBanlists(request, result) {
        try {
            const banlists = await BanlistService.getAllBanlists(request, result);
            return result.json(banlists);
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }
    async getBanlistById(request, result, next) {
        const { id } = request.params;
        try {
            const banlist = await BanlistService.getBanlistById(id, next);
            return result.status(200).json(
                { success: true, data: "ici" }
            );
        } catch (error) {
            result.status(500).json({ message: error.message });
            next(error);
        }
    }

    async addBanlist(request, result) {

        const banlistData = request.body;
        try {
            if (!banlistData.label || !banlistData.release_date || !banlistData.description) {
                return result.status(400).json({
                    message: 'Les champs label, release_date et description sont obligatoires'
                });
            }

            const alreadyExistBanlist = await Banlist.findOne({ where: { label: banlistData.label } });
            if (alreadyExistBanlist) {
                return result.status(400).json({
                    message: 'Une banlist avec ce label existe déjà'
                });
            }

            await BanlistService.addBanlist(banlistData);
            return result.status(201).json({ success: true, message: 'Banlist créé !' });
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }

    async updateBanlist(request, result, next) {
        try {
            const { id } = request.params;
            const banlistData = request.body;

            const databaseBanlist = await Banlist.findByPk(id);
            if (!databaseBanlist) {
                throw new Error('Banlist not found');
            }

            await BanlistService.updateBanlist(id, databaseBanlist, banlistData, next);
            return result.status(200).json({
                message: 'Banlist mise à jour avec succès',
            });
        } catch (error) {
            if (error.message === 'Banlist not found') {
                return result.status(404).json({ message: 'Banlist non trouvée' });
            }
            result.status(500).json({ message: error.message });
            next(error);
        }
    }

    async deleteBanlist(request, result, next) {
        const { id } = request.params;

        try {

            const existingBanlist = await Banlist.findByPk(id);
            if (!existingBanlist) {
                throw new Error('Aucune banlist trouvée');
            }

            await BanlistService.deleteBanlist(id, next);
            return result.status(200).json({ message: 'Banlist supprimée avec succès' });
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }

}

export default new BanlistController();