import { sendMail } from '../utils/nodemailer';
import fs from 'fs';
import path from 'path';
import envVars from '../config/envValidation';

export interface PlayerRemovedFromTournamentParams {
    email: string;
    username: string;
    tournamentName: string;
    reason: string;
}

export const sendPlayerRemovedFromTournamentMail = async (
    params: PlayerRemovedFromTournamentParams
): Promise<void> => {
    const templatePath = path.join(__dirname, 'templates', 'playerRemovedFromTournament.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
        .replace(/{{username}}/g, params.username)
        .replace(/{{tournamentName}}/g, params.tournamentName)
        .replace(/{{reason}}/g, params.reason || 'Non précisé.');

    const mailOptions = {
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: params.email,
        subject: `Retrait du tournoi : ${params.tournamentName}`,
        html: htmlContent
    };

    await sendMail(mailOptions);
};
