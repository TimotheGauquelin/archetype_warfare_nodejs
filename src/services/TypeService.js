import { Type, Archetype } from '../models/relations.js';

class TypeService {
    static async getTypes(next) {
        try {
            return Type.findAll()
        } catch (error) {
            next(error)
        }
    }
}

export default TypeService; 