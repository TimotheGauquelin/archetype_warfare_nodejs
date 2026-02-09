import { SummonMechanic } from '../models/relations';

class SummonMechanicService {
    static async getSummonMechanics(): Promise<SummonMechanic[]> {
        return SummonMechanic.findAll();
    }
}

export default SummonMechanicService;
