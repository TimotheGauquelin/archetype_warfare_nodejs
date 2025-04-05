import CardType from "../models/CardTypeModel.js";

class CardTypeService {
    static async getAllCardTypes() {
        return CardType.findAll();
    }
}

export default CardTypeService;
