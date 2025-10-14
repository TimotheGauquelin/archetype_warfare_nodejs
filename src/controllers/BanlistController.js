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
    async getBanlistById(request, result) {
        try {
            const banlist = await BanlistService.getBanlistById(request, result);
            return result.json(banlist);
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }

    async addBanlist(request, result) {
        try {
            const banlist = await BanlistService.addBanlist(request, result);
            return result.status(201).json({ message: 'Banlist créé !', data: banlist });
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

}

export default new BanlistController();