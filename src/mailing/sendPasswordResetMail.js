import { sendMail } from "../utils/nodemailer.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import UserService from "../services/UserService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendPasswordResetEmail = async (user, resetToken, resetLink, next) => {
    console.log("iciiiii");
    const templatePath = path.join(__dirname, 'templates', 'resetPassword.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Remplacer les variables dans le template
    htmlContent = htmlContent.replace(/{{resetLink}}/g, resetLink);

    // Change token
    await UserService.updateResetPasswordToken(user, resetToken, next)

    const mailOptions = {
        from: process.env.EMAIL_FROM_EMAILSENDER,
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html: htmlContent
    };

    await sendMail(mailOptions);
};