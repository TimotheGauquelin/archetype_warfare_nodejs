import { Attribute, Archetype } from '../models/relations.js';

class AttributeService {
    static async getAttributes(next) {
        try {
            return Attribute.findAll();
        } catch (error) {
            next(error)
        }

    }
}

export default AttributeService; 