import { Sequelize, Options } from 'sequelize';
import envVars from './envValidation';
import logger from '../utils/logger';

const env: 'development' | 'test' | 'production' = (envVars.NODE_ENV as any) || 'development';

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}

const config: Record<'development' | 'test' | 'production', DatabaseConfig> = {
    development: {
        host: envVars.DATABASE_HOST,
        port: envVars.DATABASE_PORT,
        database: envVars.DATABASE_NAME,
        username: envVars.DATABASE_USER,
        password: envVars.DATABASE_PASSWORD
    },
    test: {
        host: envVars.DATABASE_HOST_TEST || envVars.DATABASE_HOST,
        port: envVars.DATABASE_PORT_TEST || envVars.DATABASE_PORT,
        database: envVars.DATABASE_NAME_TEST || envVars.DATABASE_NAME,
        username: envVars.DATABASE_USER_TEST || envVars.DATABASE_USER,
        password: envVars.DATABASE_PASSWORD_TEST || envVars.DATABASE_PASSWORD
    },
    production: {
        // Sur Render, on utilise les mêmes variables que pour development,
        // qui sont déjà validées par envValidation.
        host: envVars.DATABASE_HOST,
        port: envVars.DATABASE_PORT,
        database: envVars.DATABASE_NAME,
        username: envVars.DATABASE_USER,
        password: envVars.DATABASE_PASSWORD
    }
};

// Sécurité : si jamais env a une valeur inattendue, on retombe sur 'development'
const currentConfig = config[env] ?? config.development;

const sequelizeOptions: Options = {
    host: currentConfig.host,
    port: currentConfig.port,
    dialect: 'postgres',
    logging: env === 'development' ? (msg: string) => logger.debug(msg) : false,
    define: {
        underscored: true,
        timestamps: false, // Désactivé par défaut, à activer dans les modèles qui en ont besoin
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

const sequelize = new Sequelize(currentConfig.database, currentConfig.username, currentConfig.password, sequelizeOptions);

// Test de la connexion à la base de données
sequelize.authenticate()
    .then((): void => {
        // sequelize.sync()
        logger.info(`Connexion à la base de données ${currentConfig.database} sur le port ${currentConfig.port} établie avec succès.`);
    })
    .catch((err: Error): void => {
        logger.logError(`Impossible de se connecter à la base de données ${currentConfig.database}`, err, {
            host: currentConfig.host,
            port: currentConfig.port,
            database: currentConfig.database
        });
        process.exit(1);
    });

export default sequelize;
