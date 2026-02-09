import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

interface EnvVars {
    NODE_ENV: 'development' | 'production' | 'test';
    API_PORT: number;
    FRONTEND_URL: string;
    
    // Database
    DATABASE_CLIENT: string;
    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_NAME: string;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
    DATABASE_SSL: boolean;
    
    // Test Database (optional)
    DATABASE_HOST_TEST?: string;
    DATABASE_PORT_TEST?: number;
    DATABASE_NAME_TEST?: string;
    DATABASE_USER_TEST?: string;
    DATABASE_PASSWORD_TEST?: string;
    
    // JWT
    JWT_SECRET: string;
    API_TOKEN_SALT: string;
    
    // Email
    EMAIL_FROM_EMAILSENDER: string;
    PASSWORD_FROM_EMAILSENDER: string;
    EMAIL_FROM?: string;
    
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    
    // PostgreSQL (for Docker)
    POSTGRES_USER?: string;
    POSTGRES_PASSWORD?: string;
    POSTGRES_DB?: string;
}

const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    API_PORT: Joi.number().default(1337),
    FRONTEND_URL: Joi.string().uri().required(),

    // Database
    DATABASE_CLIENT: Joi.string().default('postgres'),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().default(5432),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_SSL: Joi.string().valid('true', 'false').default('false'),

    // Test Database (optional)
    DATABASE_HOST_TEST: Joi.string().optional(),
    DATABASE_PORT_TEST: Joi.number().optional(),
    DATABASE_NAME_TEST: Joi.string().optional(),
    DATABASE_USER_TEST: Joi.string().optional(),
    DATABASE_PASSWORD_TEST: Joi.string().optional(),

    // JWT
    JWT_SECRET: Joi.string().min(32).required(),
    API_TOKEN_SALT: Joi.string().required(),

    // Email
    EMAIL_FROM_EMAILSENDER: Joi.string().email().required(),
    PASSWORD_FROM_EMAILSENDER: Joi.string().required(),
    EMAIL_FROM: Joi.string().email().optional(),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: Joi.string().required(),
    CLOUDINARY_API_KEY: Joi.string().required(),
    CLOUDINARY_API_SECRET: Joi.string().required(),

    // PostgreSQL (for Docker)
    POSTGRES_USER: Joi.string().optional(),
    POSTGRES_PASSWORD: Joi.string().optional(),
    POSTGRES_DB: Joi.string().optional(),
}).unknown();

const { value: envVarsRaw, error } = envVarsSchema.validate(process.env, {
    abortEarly: false,
}) as { value: Record<string, unknown>; error?: Joi.ValidationError };

if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join('\n');
    console.error('❌ Erreur de validation des variables d\'environnement:\n', errorMessages);
    process.exit(1);
}

// Convert DATABASE_SSL string to boolean
const validatedEnvVars: EnvVars = {
    ...envVarsRaw,
    DATABASE_SSL: envVarsRaw.DATABASE_SSL === 'true',
} as EnvVars;

export default validatedEnvVars;
