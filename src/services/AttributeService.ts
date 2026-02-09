import { Attribute } from '../models/relations';

class AttributeService {
    static async getAttributes(): Promise<Attribute[]> {
        return Attribute.findAll();
    }
}

export default AttributeService;
