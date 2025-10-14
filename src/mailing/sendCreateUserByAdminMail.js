import { sendMail } from '../utils/nodemailer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Admin send an email to alert user that his account is created
 * @param email
 * @param username
 * @param resetToken
 * @param termsLink
 */
export const sendCreateUserByAdminEmail = async (email, username, resetToken, termsLink) => {
    const templatePath = path.join(__dirname, 'templates', 'createUserByAdmin.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent.replace(/{{username}}/g, username);
    htmlContent = htmlContent.replace(/{{email}}/g, email);
    htmlContent = htmlContent.replace(/{{resetLink}}/g, `${process.env.FRONTEND_URL}/password-reset/${resetToken}`);
    htmlContent = htmlContent.replace(/{{termsLink}}/g, termsLink || `${process.env.FRONTEND_URL}/terms-and-conditions`);

    const mailOptions = {
        from: process.env.EMAIL_FROM_EMAILSENDER,
        to: email,
        subject: 'Création de votre compte',
        html: htmlContent
    };

    await sendMail(mailOptions);
};