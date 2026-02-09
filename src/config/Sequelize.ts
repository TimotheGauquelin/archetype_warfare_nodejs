import { Sequelize, Options } from 'sequelize';
import envVars from './envValidation';
import logger from '../utils/logger';

const env: 'development' | 'test' | 'production' = envVars.NODE_ENV || 'development';

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}

const config: Record<string, DatabaseConfig> = {
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
};

const sequelizeOptions: Options = {
    host: config[env].host,
    port: config[env].port,
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

const sequelize = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    sequelizeOptions
);

// Test de la connexion à la base de données
sequelize.authenticate()
    .then((): void => {
        // sequelize.sync()
        logger.info(`Connexion à la base de données ${config[env].database} sur le port ${config[env].port} établie avec succès.`);
    })
    .catch((err: Error): void => {
        logger.logError(`Impossible de se connecter à la base de données ${config[env].database}`, err, {
            host: config[env].host,
            port: config[env].port,
            database: config[env].database
        });
        process.exit(1);
    });

export default sequelize;
