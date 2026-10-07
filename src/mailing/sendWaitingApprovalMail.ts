import { sendMail } from '../utils/nodemailer';
import envVars from '../config/envValidation';
import logger from '../utils/logger';
import { getMailCommon, getMailSubject, loadMailTemplate, normalizeMailLocale } from './mailLocale';

interface User {
    id: string;
    email: string;
    username?: string;
    locale?: string | null;
}

interface EmailResult {
    success: boolean;
    message: string;
}

export const sendWaitingApprovalEmail = async (user: User): Promise<EmailResult> => {
    try {
        const locale = normalizeMailLocale(user.locale);
        const common = getMailCommon(locale);
        const htmlContent = loadMailTemplate('waitingApproval', locale, {
            username: user.username || common.defaultUsername,
            email: user.email,
        });

        await sendMail({
            from: envVars.EMAIL_FROM_EMAILSENDER,
            to: user.email,
            subject: getMailSubject('waitingApproval', locale),
            html: htmlContent,
        });

        return { success: true, message: 'Email d\'attente envoyé avec succès' };
    } catch (error) {
        logger.logError('Erreur lors de l\'envoi de l\'email d\'attente', error instanceof Error ? error : null, {
            userId: user.id,
            email: user.email,
        });
        throw error;
    }
};
