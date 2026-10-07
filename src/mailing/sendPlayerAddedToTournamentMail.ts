import { sendMail } from '../utils/nodemailer';
import envVars from '../config/envValidation';
import { getMailSubject, loadMailTemplate, normalizeMailLocale } from './mailLocale';

export interface PlayerAddedToTournamentParams {
    email: string;
    username: string;
    tournamentName: string;
    locale?: string | null;
}

export const sendPlayerAddedToTournamentMail = async (
    params: PlayerAddedToTournamentParams
): Promise<void> => {
    const locale = normalizeMailLocale(params.locale);
    const vars = { tournamentName: params.tournamentName };
    const htmlContent = loadMailTemplate('playerAddedToTournament', locale, {
        username: params.username,
        ...vars,
    });

    await sendMail({
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: params.email,
        subject: getMailSubject('playerAddedToTournament', locale, vars),
        html: htmlContent,
    });
};
