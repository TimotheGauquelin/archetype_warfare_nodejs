import { sendMail } from '../utils/nodemailer';
import fs from 'fs';
import path from 'path';
import envVars from '../config/envValidation';

/**
 * Admin send an email to alert user that his account is created
 * @param email - Email de l'utilisateur
 * @param username - Nom d'utilisateur
 * @param resetToken - Token de réinitialisation
 * @param termsLink - Lien vers les conditions (optionnel)
 */
export const sendCreateUserByAdminEmail = async (
    email: string,
    username: string,
    resetToken: string,
    termsLink?: string
): Promise<void> => {
    const templatePath = path.join(__dirname, 'templates', 'createUserByAdmin.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent.replace(/{{username}}/g, username);
    htmlContent = htmlContent.replace(/{{email}}/g, email);
    htmlContent = htmlContent.replace(/{{resetLink}}/g, `${envVars.FRONTEND_URL}/password-reset/${resetToken}`);
    htmlContent = htmlContent.replace(/{{termsLink}}/g, termsLink || `${envVars.FRONTEND_URL}/terms-and-conditions`);

    const mailOptions = {
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: email,
        subject: 'Création de votre compte',
        html: htmlContent
    };

    await sendMail(mailOptions);
};
