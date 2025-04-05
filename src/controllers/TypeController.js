import TypeService from "../services/TypeService.js";

class TypeController {
    async getTypes(request, response) {
        try {
            const types = await TypeService.getTypes(request, response)
            return response.status(200).json(types)
        } catch (error) {
            response.status(500).json({ message: error.message });
        }
    }
}

export default new TypeController()