import fs from 'fs';
import path from 'path';
import {
    mailI18n,
    type MailLocale,
    type MailMessages,
    type MailTemplateName,
} from './i18n/mail';

export type { MailLocale, MailTemplateName };

export const normalizeMailLocale = (locale?: string | null): MailLocale => {
    const value = String(locale || 'fr').trim().toLowerCase();
    return value === 'en' ? 'en' : 'fr';
};

const applyVars = (text: string, vars: Record<string, string>): string => {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
};

const flattenTemplateMessages = (
    messages: MailMessages,
    templateName: MailTemplateName
): Record<string, string> => {
    const common = messages.common;
    const specific = messages[templateName] as Record<string, string>;

    const flat: Record<string, string> = {
        'common.team': common.team,
        'common.autoFooter': common.autoFooter,
        'common.copyright': common.copyright,
        'common.defaultUsername': common.defaultUsername,
        'common.defaultReason': common.defaultReason,
    };

    for (const [key, value] of Object.entries(specific)) {
        flat[key] = value;
    }

    return flat;
};

/**
 * Charge un template HTML unique et injecte les textes i18n (`{{t.*}}`) + variables (`{{var}}`).
 * Remplace aussi `{{year}}` et `{{lang}}`.
 */
export const loadMailTemplate = (
    templateName: MailTemplateName,
    locale?: string | null,
    vars: Record<string, string> = {}
): string => {
    const normalized = normalizeMailLocale(locale);
    const messages = mailI18n[normalized];
    const filePath = path.join(__dirname, 'templates', `${templateName}.html`);
    let html = fs.readFileSync(filePath, 'utf8');

    const withGlobals: Record<string, string> = {
        year: String(new Date().getFullYear()),
        lang: normalized,
        ...vars,
    };

    const flatMessages = flattenTemplateMessages(messages, templateName);
    for (const [key, value] of Object.entries(flatMessages)) {
        const resolved = applyVars(value, withGlobals);
        const escapedKey = key.replace(/\./g, '\\.');
        html = html.replace(new RegExp(`\\{\\{t\\.${escapedKey}\\}\\}`, 'g'), resolved);
    }

    html = applyVars(html, withGlobals);
    return html;
};

export const getMailSubject = (
    templateName: MailTemplateName,
    locale?: string | null,
    vars: Record<string, string> = {}
): string => {
    const normalized = normalizeMailLocale(locale);
    const subject = mailI18n[normalized][templateName].subject;
    return applyVars(subject, vars);
};

export const getMailCommon = (locale?: string | null) =>
    mailI18n[normalizeMailLocale(locale)].common;
