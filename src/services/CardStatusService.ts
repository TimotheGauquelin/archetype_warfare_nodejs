import CardStatus from '../models/CardStatusModel';

class CardStatusService {
    static async getAllCardStatuses(): Promise<CardStatus[]> {
        return CardStatus.findAll();
    }
}

export default CardStatusService;
