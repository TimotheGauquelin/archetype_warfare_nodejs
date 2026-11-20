import type { Response } from 'express';
import envVars from '../config/envValidation';

export const AUTH_COOKIE_NAME = 'aw_access_token';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function cookieOptions() {
    const isProd = envVars.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
        maxAge: TWO_HOURS_MS,
        path: '/',
    };
}

export function setAuthCookie(response: Response, token: string): void {
    response.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(response: Response): void {
    response.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: envVars.NODE_ENV === 'production',
        sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
}

export function getJwtExpiryUnix(token: string): number | null {
    try {
        const payload = JSON.parse(
            Buffer.from(token.split('.')[1] || '', 'base64url').toString('utf8')
        ) as { exp?: number };
        return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
        return null;
    }
}
