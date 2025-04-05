import CardStatus from "../models/CardStatusModel.js";

class CardStatusService {
    static async getAllCardStatuses() {
        return CardStatus.findAll();
    }
}

export default CardStatusService;