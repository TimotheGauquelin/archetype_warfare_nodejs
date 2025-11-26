import WebsiteActions from '../models/WebsiteActionsModel.js';

class WebsiteActionsService {

    static async getConfig() {
        try {
            const config = await WebsiteActions.findByPk(1);
            return config.toJSON();
        } catch (error) {
            throw new CustomError(error.message, 500);
        }
    }

    static async toggleStreamBanner() {
        try {
            const config = await WebsiteActions.findByPk(1);
            if (!config) {
                throw new CustomError('Configuration non trouvée', 404);
            }

            config.stream_banner_enabled = !config.stream_banner_enabled
            const newConfig = await config.save();
            return newConfig.toJSON();
        } catch (error) {
            throw new CustomError(error.message, 500);
        }
    }

    static async toggleRegistration(enabled) {
        try {
            const config = await WebsiteActions.findByPk(1);
            if (!config) {
                throw new CustomError('Configuration non trouvée', 404);
            }
            config.registration_enabled = !config.registration_enabled;
            const newConfig = await config.save();
            return newConfig.toJSON();
        } catch (error) {
            throw new CustomError(error.message, 500);
        }
    }
}

export default WebsiteActionsService;
