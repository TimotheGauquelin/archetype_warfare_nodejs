import { sendMail } from '../utils/nodemailer';
import fs from 'fs';
import path from 'path';
import envVars from '../config/envValidation';

export interface PlayerAddedToTournamentParams {
    email: string;
    username: string;
    tournamentName: string;
}

export const sendPlayerAddedToTournamentMail = async (
    params: PlayerAddedToTournamentParams
): Promise<void> => {
    const templatePath = path.join(__dirname, 'templates', 'playerAddedToTournament.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
        .replace(/{{username}}/g, params.username)
        .replace(/{{tournamentName}}/g, params.tournamentName);

    const mailOptions = {
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: params.email,
        subject: `Inscription au tournoi : ${params.tournamentName}`,
        html: htmlContent
    };

    await sendMail(mailOptions);
};
