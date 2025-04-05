import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
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
    }
)

sequelize.authenticate()
    .then(() => {
        console.log(`Connection of ${config[env].database} has been established successfully.`);
    })
    .catch(err => {
        console.error(`Unable to connect to the database ${config[env].database}:`, err);
    });

export default sequelize;