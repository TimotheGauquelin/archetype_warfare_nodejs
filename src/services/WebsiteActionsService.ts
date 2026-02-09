import WebsiteActions from '../models/WebsiteActionsModel';
import { CustomError } from '../errors/CustomError';

interface WebsiteConfig {
    id: number;
    stream_banner_enabled: boolean;
    registration_enabled: boolean;
}

class WebsiteActionsService {
    static async getConfig(): Promise<WebsiteConfig> {
        const config = await WebsiteActions.findByPk(1);
        if (!config) {
            throw new CustomError('Configuration non trouvée', 404);
        }
        return config.toJSON() as WebsiteConfig;
    }

    static async toggleStreamBanner(): Promise<WebsiteConfig> {
        const config = await WebsiteActions.findByPk(1);
        if (!config) {
            throw new CustomError('Configuration non trouvée', 404);
        }

        config.stream_banner_enabled = !config.stream_banner_enabled;
        const newConfig = await config.save();
        return newConfig.toJSON() as WebsiteConfig;
    }

    static async toggleRegistration(): Promise<WebsiteConfig> {
        const config = await WebsiteActions.findByPk(1);
        if (!config) {
            throw new CustomError('Configuration non trouvée', 404);
        }
        config.registration_enabled = !config.registration_enabled;
        const newConfig = await config.save();
        return newConfig.toJSON() as WebsiteConfig;
    }
}

export default WebsiteActionsService;
