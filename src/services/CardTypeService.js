import CardType from '../models/CardTypeModel.js';

class CardTypeService {
    static async getAllCardTypes() {
        const cardTypes = await CardType.findAll({
            attributes: ['id', 'label', 'num_order'],
            order: [['num_order', 'ASC']]
        });

        return {
            data: cardTypes,
            total: cardTypes.length
        };
    }
}

export default CardTypeService;
