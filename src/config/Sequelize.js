import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';

// Vérification des variables d'environnement requises
const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASSWORD'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Erreur: La variable d'environnement ${envVar} n'est pas définie`);
        process.exit(1);
    }
}

const config = {
    development: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        database: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD
    },
    test: {
        host: process.env.DATABASE_HOST_TEST,
        port: process.env.DATABASE_PORT_TEST,
        database: process.env.DATABASE_NAME_TEST,
        username: process.env.DATABASE_USER_TEST,
        password: process.env.DATABASE_PASSWORD_TEST
    },
};

const sequelize = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    {
        host: config[env].host,
        port: config[env].port,
        dialect: "postgres",
        logging: env === 'development' ? console.log : false,
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
    }
);

// Test de la connexion à la base de données
sequelize.authenticate()
    .then(() => {
        // sequelize.sync()
        console.log(`Connexion à la base de données ${config[env].database} sur le port ${config[env].port} établie avec succès.`);
    })
    .catch(err => {
        console.error(`Impossible de se connecter à la base de données ${config[env].database}:`, err);
        process.exit(1);
    });

export default sequelize;