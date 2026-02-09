import { Type } from '../models/relations';

class TypeService {
    static async getTypes(): Promise<Type[]> {
        return Type.findAll();
    }
}

export default TypeService;
