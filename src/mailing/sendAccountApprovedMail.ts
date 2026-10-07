import { sendMail } from '../utils/nodemailer';
import envVars from '../config/envValidation';
import logger from '../utils/logger';
import { getMailSubject, loadMailTemplate, normalizeMailLocale } from './mailLocale';

interface User {
    id: string;
    email: string;
    username?: string;
    locale?: string | null;
}

export const sendAccountApprovedEmail = async (user: User, _roleLabels: string[]): Promise<void> => {
    try {
        const locale = normalizeMailLocale(user.locale);
        const htmlContent = loadMailTemplate('accountApproved', locale, {
            loginUrl: `${envVars.FRONTEND_URL}/login`,
        });

        await sendMail({
            from: envVars.EMAIL_FROM_EMAILSENDER,
            to: user.email,
            subject: getMailSubject('accountApproved', locale),
            html: htmlContent,
        });

        logger.logInfo('Email de confirmation d\'approbation envoyé', {
            userId: user.id,
            email: user.email,
        });
    } catch (error) {
        logger.logError(
            'Erreur lors de l\'envoi de l\'email de confirmation d\'approbation',
            error instanceof Error ? error : null,
            {
                userId: user.id,
                email: user.email,
            }
        );
        throw error;
    }
};
