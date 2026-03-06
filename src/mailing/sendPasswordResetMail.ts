import { sendMail } from '../utils/nodemailer';
import fs from 'fs';
import path from 'path';
import UserService from '../services/UserService';
import envVars from '../config/envValidation';

interface User {
    id: number;
    email: string;
}

export const sendPasswordResetEmail = async (
    user: User,
    resetToken: string,
    resetLink: string
): Promise<void> => {
    const templatePath = path.join(__dirname, 'templates', 'resetPassword.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Remplacer les variables dans le template
    htmlContent = htmlContent.replace(/{{resetLink}}/g, resetLink);

    // Change token
    await UserService.updateResetPasswordToken(user as import('../models/UserModel').default, resetToken);

    const mailOptions = {
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe',
        html: htmlContent
    };

    await sendMail(mailOptions);
};
