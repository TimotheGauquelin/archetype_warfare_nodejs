import BanlistService from "../services/BanlistService.js";

class BanlistController {
    async getCurrentBanlist(request, result) {
        try {
            const banlist = await BanlistService.getCurrentBanlist(request, result)
            return result.json(banlist)
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }

    async getAllBanlists(request, result) {
        try {
            const banlists = await BanlistService.getAllBanlists(request, result)
            return result.json(banlists)
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }

    async addBanlist(request, result) {
        try {
            const banlist = await BanlistService.addBanlist(request, result)
            return result.status(201).json({message: 'Banlist créé !', data: banlist})
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    }
}

export default new BanlistController()