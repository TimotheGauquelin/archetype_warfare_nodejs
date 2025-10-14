import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transporter } from '../utils/nodemailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Envoie un email de confirmation d'approbation de compte
 * @param {Object} user - L'utilisateur approuvé
 * @param {Array} roles - Les rôles attribués à l'utilisateur
 * @param {Function} next - Fonction de callback pour la gestion d'erreur
 */
export const sendAccountApprovedEmail = async (user, roles, next) => {
    try {
        // Lire le template HTML
        const templatePath = path.join(__dirname, 'templates', 'accountApproved.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Remplacer les variables dans le template
        htmlContent = htmlContent
            .replace(/{{loginUrl}}/g, `${process.env.FRONTEND_URL}/login`);

        // Configuration de l'email
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@archetypewarfare.com',
            to: user.email,
            subject: '🎉 Votre compte a été approuvé - Archetype Warfare',
            html: htmlContent
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);

        console.log(`Email de confirmation d'approbation envoyé à ${user.email}`);

    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation d\'approbation:', error);
        if (next) {
            next(error);
        }
    }
}; 