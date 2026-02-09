import app from './index';
import envVars from './config/envValidation';
import logger from './utils/logger';

const PORT: number = envVars.API_PORT || 1337;

app.listen(PORT, (): void => {
    logger.info(`🚀 L'API est lancée sur le port ${PORT}`, {
        environment: envVars.NODE_ENV,
        port: PORT
    });
});
