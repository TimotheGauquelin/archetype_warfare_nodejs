import CardType from '../models/CardTypeModel';

interface CardTypeResult {
    data: CardType[];
    total: number;
}

class CardTypeService {
    static async getAllCardTypes(): Promise<CardTypeResult> {
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
