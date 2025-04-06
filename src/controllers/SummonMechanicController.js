import SummonMechanicService from "../services/SummonMechanicService.js";

class SummonMechanicController {
    async getSummonMechanics(request, response, next) {
        try {
            const summonmechanics = await SummonMechanicService.getSummonMechanics(request, response, next)
            return response.status(200).json(summonmechanics)
        } catch (error) {
            response.status(500).json({ message: error.message });
        }
    }
}

export default new SummonMechanicController()