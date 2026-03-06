import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

interface LogMetadata {
    [key: string]: unknown;
}


// Extension du type Logger pour inclure les méthodes personnalisées
interface ExtendedLogger extends winston.Logger {
    logInfo: (message: string, meta?: LogMetadata) => void;
    logError: (message: string, error?: Error | null, meta?: LogMetadata) => void;
    logWarn: (message: string, meta?: LogMetadata) => void;
    logDebug: (message: string, meta?: LogMetadata) => void;
}

// Format personnalisé pour la console
const consoleFormat = printf((info: winston.Logform.TransformableInfo) => {
    let msg = `${info.timestamp} [${info.level}]: ${info.message}`;
    
    if (info.stack) {
        msg += `\n${info.stack}`;
    }
    
    const metadata: LogMetadata = { ...info };
    delete metadata.level;
    delete metadata.message;
    delete metadata.timestamp;
    delete metadata.stack;
    
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
});

// Configuration des transports
const transports: winston.transport[] = [];

// Transport console (toujours actif)
transports.push(
    new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            consoleFormat
        ),
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    })
);

// Transport fichier pour les erreurs (production uniquement)
if (process.env.NODE_ENV === 'production') {
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            format: combine(
                timestamp(),
                errors({ stack: true }),
                json()
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );

    // Transport fichier pour tous les logs
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            format: combine(
                timestamp(),
                errors({ stack: true }),
                json()
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Création du logger
const loggerBase = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
    ),
    transports,
    // Ne pas quitter en cas d'erreur
    exitOnError: false,
});

// Méthodes helper pour faciliter la migration depuis console.log
const logger = loggerBase as ExtendedLogger;

logger.logInfo = (message: string, meta: LogMetadata = {}): void => {
    logger.info(message, meta);
};

logger.logError = (message: string, error: Error | null = null, meta: LogMetadata = {}): void => {
    if (error) {
        logger.error(message, { ...meta, error: error.message, stack: error.stack });
    } else {
        logger.error(message, meta);
    }
};

logger.logWarn = (message: string, meta: LogMetadata = {}): void => {
    logger.warn(message, meta);
};

logger.logDebug = (message: string, meta: LogMetadata = {}): void => {
    logger.debug(message, meta);
};

export default logger;
