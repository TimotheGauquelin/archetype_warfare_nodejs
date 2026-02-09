import { Request, Response, NextFunction } from 'express';
import AttributeService from '../services/AttributeService';

class AttributeController {
    async getAttributes(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const attributes = await AttributeService.getAttributes();
            response.status(200).json(attributes);
        } catch (error) {
            next(error);
        }
    }
}

export default new AttributeController();
