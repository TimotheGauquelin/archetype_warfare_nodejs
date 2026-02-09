import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import envVars from '../config/envValidation';
import logger from './logger';

export const transporter: Transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: envVars.EMAIL_FROM_EMAILSENDER,
        pass: envVars.PASSWORD_FROM_EMAILSENDER
    }
});

export const sendMail = async (mailOptions: SendMailOptions): Promise<void> => {
    try {
        await transporter.sendMail(mailOptions);
        logger.logDebug('Email envoyé avec succès', {
            to: mailOptions.to,
            subject: mailOptions.subject
        });
    } catch (error) {
        logger.logError('Erreur lors de l\'envoi de l\'email', error instanceof Error ? error : null, {
            to: mailOptions.to,
            subject: mailOptions.subject
        });
        throw error;
    }
};
