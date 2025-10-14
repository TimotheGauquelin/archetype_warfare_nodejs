import { Era } from '../models/relations.js';

class EraService {
    static async getEras(next) {
        try {
            return Era.findAll();
        } catch (error) {
            next(error);
        }
    }
}

export default EraService; 