import { Era } from '../models/relations';

class EraService {
    static async getEras(): Promise<Era[]> {
        return Era.findAll();
    }
}

export default EraService;
