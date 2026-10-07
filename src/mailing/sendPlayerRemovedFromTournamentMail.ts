import { sendMail } from '../utils/nodemailer';
import envVars from '../config/envValidation';
import { getMailCommon, getMailSubject, loadMailTemplate, normalizeMailLocale } from './mailLocale';

export interface PlayerRemovedFromTournamentParams {
    email: string;
    username: string;
    tournamentName: string;
    reason: string;
    locale?: string | null;
}

export const sendPlayerRemovedFromTournamentMail = async (
    params: PlayerRemovedFromTournamentParams
): Promise<void> => {
    const locale = normalizeMailLocale(params.locale);
    const common = getMailCommon(locale);
    const vars = { tournamentName: params.tournamentName };
    const htmlContent = loadMailTemplate('playerRemovedFromTournament', locale, {
        username: params.username,
        reason: params.reason || common.defaultReason,
        ...vars,
    });

    await sendMail({
        from: envVars.EMAIL_FROM_EMAILSENDER,
        to: params.email,
        subject: getMailSubject('playerRemovedFromTournament', locale, vars),
        html: htmlContent,
    });
};
