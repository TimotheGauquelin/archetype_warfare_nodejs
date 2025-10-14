import { SummonMechanic } from '../models/relations.js';

class SummonMechanicService {
    static async getSummonMechanics(next) {
        try {
            return SummonMechanic.findAll();
        } catch (error) {
            next(error);
        }
    }
}

export default SummonMechanicService; 