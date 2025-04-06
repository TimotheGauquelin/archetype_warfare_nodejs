import { Banlist, BanlistArchetypeCard, Archetype, Card, CardStatus } from '../models/relations.js';

class BanlistService {
    static async getAllBanlists() {
        return Banlist.findAll({
            include: [{
                model: BanlistArchetypeCard,
                include: [
                    { model: Archetype },
                    { model: Card },
                    { model: CardStatus }
                ]
            }]
        });
    }

    // static async getBanlistById(id) {
    //     return Banlist.findByPk(id, {
    //         include: [{
    //             model: BanlistArchetypeCard,
    //             include: [
    //                 { model: Archetype },
    //                 { model: Card },
    //                 { model: CardStatus }
    //             ]
    //         }]
    //     });
    // }

    // static async createBanlist(data) {
    //     return Banlist.create(data);
    // }

    // static async updateBanlist(id, data) {
    //     const [updated] = await Banlist.update(data, {
    //         where: { id },
    //         returning: true
    //     });
    //     return updated;
    // }

    // static async deleteBanlist(id) {
    //     return Banlist.destroy({
    //         where: { id }
    //     });
    // }
}

export default BanlistService; 