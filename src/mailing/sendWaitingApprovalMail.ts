import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendMail } from '../utils/nodemailer';
import envVars from '../config/envValidation';
import logger from '../utils/logger';

interface User {
    id: number;
    email: string;
    username?: string;
}

interface EmailResult {
    success: boolean;
    message: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendWaitingApprovalEmail = async (user: User): Promise<EmailResult> => {
    try {
        const templatePath = path.join(__dirname, 'templates', 'waitingApproval.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        htmlContent = htmlContent
            .replace(/{{username}}/g, user.username || 'Utilisateur')
            .replace(/{{email}}/g, user.email)
            .replace(/{{registrationDate}}/g, new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));

        const mailOptions = {
            from: envVars.EMAIL_FROM_EMAILSENDER,
            to: user.email,
            subject: 'Inscription en attente d\'approbation - Archetype Warfare',
            html: htmlContent
        };

        await sendMail(mailOptions);

        return { success: true, message: 'Email d\'attente envoyé avec succès' };
    } catch (error) {
        logger.logError('Erreur lors de l\'envoi de l\'email d\'attente', error instanceof Error ? error : null, {
            userId: user.id,
            email: user.email
        });
        throw error;
    }
};
