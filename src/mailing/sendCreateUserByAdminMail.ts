import { sendMail } from '../utils/nodemailer';
import envVars from '../config/envValidation';
import { getMailSubject, loadMailTemplate, normalizeMailLocale } from './mailLocale';

/**
 * Admin send an email to alert user that his account is created
 */
export const sendCreateUserByAdminEmail = async (
    email: string,
    username: string,
    resetToken: string,
    termsLink?: string,
    locale?: string | null
): Promise<void> => {
    const normalized = normalizeMailLocale(locale);
    const resetLink = `${envVars.FRONTEND_URL}/password-reset/${resetToken}`;
    const htmlContent = loadMailTemplate('createUserByAdmin', normalized, {
        username,
        email,
        resetLink,
        termsLink: termsLink || `${envVars.FRONTEND_URL}/terms-and-conditions`,
    });

    await sendMail({
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: email,
        subject: getMailSubject('createUserByAdmin', normalized),
        html: htmlContent,
    });
};
