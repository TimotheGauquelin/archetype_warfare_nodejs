import AttributeService from '../services/AttributeService.js';

class AttributeController {
    async getAttributes(request, response, next) {
        try {
            const attributes = await AttributeService.getAttributes(request, response, next);
            return response.status(200).json(attributes);
        } catch (error) {
            next(error);
        }
    }
}

export default new AttributeController();