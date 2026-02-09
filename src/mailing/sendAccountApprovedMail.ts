import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transporter } from '../utils/nodemailer';
import envVars from '../config/envValidation';
import logger from '../utils/logger';

interface User {
    id: number;
    email: string;
    username?: string;
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Envoie un email de confirmation d'approbation de compte
 * @param user - L'utilisateur approuvé
 * @param roles - Les rôles attribués à l'utilisateur
 * @param next - Fonction de callback pour la gestion d'erreur (optionnel)
 */
export const sendAccountApprovedEmail = async (user: User, _roleLabels: string[]): Promise<void> => {
    try {
        // Lire le template HTML
        const templatePath = path.join(__dirname, 'templates', 'accountApproved.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Remplacer les variables dans le template
        htmlContent = htmlContent
            .replace(/{{loginUrl}}/g, `${envVars.FRONTEND_URL}/login`);

        // Configuration de l'email
        const mailOptions = {
            from: envVars.EMAIL_FROM || 'noreply@archetypewarfare.com',
            to: user.email,
            subject: '🎉 Votre compte a été approuvé - Archetype Warfare',
            html: htmlContent
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);

        logger.logInfo('Email de confirmation d\'approbation envoyé', {
            userId: user.id,
            email: user.email
        });

    } catch (error) {
        logger.logError('Erreur lors de l\'envoi de l\'email de confirmation d\'approbation', error instanceof Error ? error : null, {
            userId: user.id,
            email: user.email
        });
        throw error;
    }
};
