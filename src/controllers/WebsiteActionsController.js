import WebsiteActionsService from '../services/WebsiteActionsService.js';

class WebsiteActionsController {


    async getConfig(request, response, next) {
        try {
            const config = await WebsiteActionsService.getConfig();
            return response.status(200).json(config);
        } catch (error) {
            next(error);
        }
    }

    async toggleStreamBanner(request, response, next) {
        try {
            const config = await WebsiteActionsService.toggleStreamBanner();
            return response.status(200).json({
                success: true,
                message: `Bannière de stream ${config.stream_banner_enabled ? 'activée' : 'désactivée'}`,
            });
        } catch (error) {
            next(error);
        }
    }

    async toggleRegistration(request, response, next) {
        try {
            const config = await WebsiteActionsService.toggleRegistration();
            return response.status(200).json({
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
