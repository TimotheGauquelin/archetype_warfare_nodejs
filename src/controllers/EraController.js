import EraService from "../services/EraService.js";

class EraController {
    async getEras(request, response, next) {
        try {
            const eras = await EraService.getEras(next)
            return response.status(200).json(eras)
        } catch (error) {
            next(error)
        }
    }
}

export default new EraController()