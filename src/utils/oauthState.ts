import crypto from 'crypto';
import envVars from '../config/envValidation';

export type DiscordOAuthState = {
    locale: 'fr' | 'en';
    acceptedTerms: boolean;
};

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function sign(body: string): string {
    return crypto.createHmac('sha256', envVars.JWT_SECRET).update(body).digest('base64url');
}

function timingSafeEqualStr(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

/** State OAuth signé (anti-CSRF) : body.base64url + HMAC */
export function createDiscordOAuthState(payload: DiscordOAuthState): string {
    const data = {
        ...payload,
        nonce: crypto.randomBytes(16).toString('hex'),
        iat: Date.now(),
    };
    const body = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
    return `${body}.${sign(body)}`;
}

export function verifyDiscordOAuthState(stateRaw: string): DiscordOAuthState {
    const parts = stateRaw.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error('invalid_state');
    }
    const [body, signature] = parts;
    if (!timingSafeEqualStr(signature, sign(body))) {
        throw new Error('invalid_state_signature');
    }

    let parsed: { locale?: string; acceptedTerms?: boolean; iat?: number };
    try {
        parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as typeof parsed;
    } catch {
        throw new Error('invalid_state_payload');
    }

    if (typeof parsed.iat !== 'number' || Date.now() - parsed.iat > STATE_TTL_MS) {
        throw new Error('expired_state');
    }

    return {
        locale: parsed.locale === 'en' ? 'en' : 'fr',
        acceptedTerms: Boolean(parsed.acceptedTerms),
    };
}
