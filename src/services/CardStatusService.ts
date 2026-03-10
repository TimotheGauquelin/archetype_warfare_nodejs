import CardStatus from '../models/CardStatusModel';

class CardStatusService {
    static async getAllCardStatuses(): Promise<CardStatus[]> {
        return CardStatus.findAll(
            {
                // Trie par limite croissante
                order: [['limit', 'ASC']]
            }
        );
    }
}

export default CardStatusService;
