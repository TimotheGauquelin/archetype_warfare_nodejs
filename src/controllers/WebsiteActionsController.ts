import { Request, Response, NextFunction } from 'express';
import WebsiteActionsService from '../services/WebsiteActionsService';

class WebsiteActionsController {
    async getConfig(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const config = await WebsiteActionsService.getConfig();
            response.status(200).json(config);
        } catch (error) {
            next(error);
        }
    }

    async toggleStreamBanner(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const config = await WebsiteActionsService.toggleStreamBanner();
            response.status(200).json({
                success: true,
                message: `Bannière de stream ${config.stream_banner_enabled ? 'activée' : 'désactivée'}`,
            });
        } catch (error) {
            next(error);
        }
    }

    async toggleRegistration(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const config = await WebsiteActionsService.toggleRegistration();
            response.status(200).json({
                success: true,
                message: `Inscriptions ${config.registration_enabled ? 'activées' : 'désactivées'}`,
                data: config
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new WebsiteActionsController();
