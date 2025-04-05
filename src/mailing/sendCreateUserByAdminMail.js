import { sendMail } from "../utils/nodemailer.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendCreateUserByAdminEmail = async (email, username, password, resetLink) => {
    const templatePath = path.join(__dirname, 'templates', 'createUserByAdmin.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Remplacer les variables dans le template
    htmlContent = htmlContent.replace(/{{username}}/g, username);
    htmlContent = htmlContent.replace(/{{password}}/g, password);
    htmlContent = htmlContent.replace(/{{resetLink}}/g, resetLink);

    const mailOptions = {
        from: process.env.EMAIL_FROM_EMAILSENDER,
        to: email,
        subject: "Création de votre compte",
        html: htmlContent
    };

    await sendMail(mailOptions);
};