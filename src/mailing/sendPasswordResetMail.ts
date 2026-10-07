import { sendMail } from '../utils/nodemailer';
import UserService from '../services/UserService';
import envVars from '../config/envValidation';
import { getMailSubject, loadMailTemplate, normalizeMailLocale } from './mailLocale';

interface User {
    id: string;
    email: string;
    locale?: string | null;
}

export const sendPasswordResetEmail = async (
    user: User,
    resetToken: string,
    resetLink: string
): Promise<void> => {
    const locale = normalizeMailLocale(user.locale);
    const htmlContent = loadMailTemplate('resetPassword', locale, {
        resetLink,
    });

    await UserService.updateResetPasswordToken(user as unknown as import('../models/UserModel').default, resetToken);

    await sendMail({
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: user.email,
        subject: getMailSubject('resetPassword', locale),
        html: htmlContent,
    });
};
