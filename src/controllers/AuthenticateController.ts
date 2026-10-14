import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, Role } from '../models/relations';
import { CustomError } from '../errors/CustomError';
import { sendPasswordResetEmail } from '../mailing/sendPasswordResetMail';
import AuthenticateService from '../services/AuthenticateService';
import DiscordAuthService from '../services/DiscordAuthService';
import { generateRandomToken } from '../utils/token';
import envVars from '../config/envValidation';
import { getUuidParam } from '../utils/request';

class AuthenticateController {
    async discordRedirect(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            DiscordAuthService.assertConfigured();
            const locale = request.query.locale === 'en' ? 'en' : 'fr';
            const acceptedTerms = request.query.accepted_terms === '1' || request.query.accepted_terms === 'true';
            const statePayload = Buffer.from(
                JSON.stringify({
                    nonce: crypto.randomBytes(16).toString('hex'),
                    locale,
                    acceptedTerms,
                }),
                'utf8'
            ).toString('base64url');

            response.redirect(DiscordAuthService.getAuthorizeUrl(statePayload));
        } catch (error) {
            next(error);
        }
    }

    async discordCallback(request: Request, response: Response, _next: NextFunction): Promise<void> {
        try {
            const code = typeof request.query.code === 'string' ? request.query.code : '';
            const stateRaw = typeof request.query.state === 'string' ? request.query.state : '';
            const oauthError = typeof request.query.error === 'string' ? request.query.error : '';

            const frontCallback = `${envVars.FRONTEND_URL}/login/discord/callback`;

            if (oauthError || !code) {
                const message = encodeURIComponent(
                    oauthError === 'access_denied'
                        ? 'Connexion Discord annulée.'
                        : 'Connexion Discord impossible.'
                );
                response.redirect(`${frontCallback}?error=${message}`);
                return;
            }

            let locale = 'fr';
            let acceptedTerms = false;
            try {
                const parsed = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8')) as {
                    locale?: string;
                    acceptedTerms?: boolean;
                };
                locale = parsed.locale === 'en' ? 'en' : 'fr';
                acceptedTerms = Boolean(parsed.acceptedTerms);
            } catch {
                // state optionnel / invalide
            }

            const result = await DiscordAuthService.handleOAuthCallback(code, {
                locale,
                acceptedTerms,
            });

            if (result.status === 'authenticated') {
                response.redirect(`${frontCallback}?token=${encodeURIComponent(result.token)}`);
                return;
            }

            if (result.status === 'pending_approval') {
                response.redirect(
                    `${frontCallback}?pending=1&message=${encodeURIComponent(result.message)}`
                );
                return;
            }

            response.redirect(
                `${frontCallback}?error=${encodeURIComponent(result.message)}`
            );
        } catch (error) {
            const frontCallback = `${envVars.FRONTEND_URL}/login/discord/callback`;
            const message = error instanceof CustomError
                ? error.message
                : 'Connexion Discord impossible.';
            response.redirect(`${frontCallback}?error=${encodeURIComponent(message)}`);
        }
    }

    async login(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = request.body;

            const user = await User.findOne({
                where: { email },
                include: [{
                    model: Role,
                    as: 'roles'
                }]
            });

            if (!user) {
                throw new CustomError('Votre email ou votre mot de passe ne correspondent pas', 400);
            }

            if (!user.password) {
                throw new CustomError('Votre email ou votre mot de passe ne correspondent pas', 400);
            }

            const isValidPassword = await User.validPassword(user.password, password);

            if (!isValidPassword) {
                throw new CustomError('Votre email ou votre mot de passe ne correspondent pas', 400);
            }

            if (user.is_banned) {
                throw new CustomError('Votre compte est banni. Veuillez contacter un administrateur', 403);
            }

            if (!user.is_active) {
                throw new CustomError('Votre compte doit être validé par un administrateur', 400);
            }

            if (!user.has_accepted_terms_and_conditions) {
                throw new CustomError('Vous devez accepter les conditions d\'utilisation', 400);
            }

            const token = await User.generateToken(user);

            const userWithRoles = user as User & { roles?: Role[] };
            response.status(200).json({
                success: true,
                message: 'Connexion réussie !',
                token: token,
                user: {
                    id: user.id,
                    email: user.email || '',
                    username: user.username,
                    roles: userWithRoles.roles ? userWithRoles.roles.map((role: Role) => role.label) : []
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async requestNewPassword(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { email, locale: bodyLocale } = request.body;

            if (!email) {
                throw new CustomError('Un email est requis.', 400);
            }

            const user = await User.findOne({
                where: { email },
            });

            if (user) {
                const resetToken = generateRandomToken();
                const resetLink = `${envVars.FRONTEND_URL}/password-reset/${resetToken}`;
                const locale =
                    bodyLocale === 'en' || bodyLocale === 'fr' ? bodyLocale : user.locale;

                if (locale && locale !== user.locale) {
                    await user.update({ locale });
                }

                await sendPasswordResetEmail(
                    { id: user.id, email: user.email ?? '', locale },
                    resetToken,
                    resetLink
                );
            }

            response.status(200).json({
                success: true,
                message: 'Un email de réinitialisation a été envoyé.'
            });

        } catch (error) {
            next(error);
        }
    }

    async updatePassword(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUuidParam(request.params.userId);
            const {
                password,
                confirmPassword,
                has_accepted_terms_and_conditions: hasAcceptedTermsAndConditions,
            } = request.body;

            if (!password || !confirmPassword) {
                throw new CustomError('Le mot de passe et la confirmation du mot de passe sont requis.', 400);
            }

            if (password !== confirmPassword) {
                throw new CustomError('Les mots de passe ne correspondent pas.', 400);
            }

            if (!hasAcceptedTermsAndConditions) {
                throw new CustomError('Vous devez accepter les conditions d\'utilisation', 400);
            }

            const user = await User.findByPk(userId);

            if (!user) {
                throw new CustomError('L\'utilisateur n\'a pas été trouvé.', 404);
            }

            await AuthenticateService.updatePassword(user, password, true);

            response.status(200).json({
                success: true,
                message: 'Le mot de passe a été mis à jour avec succès.'
            });
        } catch (error) {
            next(error);
        }
    }

    async register(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, username, hasAcceptedTermsAndConditions, locale } = request.body;

            if (!email || !password) {
                throw new CustomError('Email et mot de passe requis', 400);
            }

            if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
                throw new CustomError('Un nom d\'utilisateur valide (3 à 30 caractères) est requis', 400);
            }

            if (!hasAcceptedTermsAndConditions) {
                throw new CustomError('Vous devez accepter les conditions d\'utilisation', 400);
            }

            const existingEmail = await User.findOne({ where: { email: email.trim() } });
            const existingUsername = await User.findOne({ where: { username: username.trim() } });

            if (existingEmail) {
                throw new CustomError('Un utilisateur avec cet email existe déjà.', 400);
            }
            if (existingUsername) {
                throw new CustomError('Ce nom d\'utilisateur est déjà utilisé.', 400);
            }

            const registrationResult = await AuthenticateService.register({
                email,
                password,
                username: username,
                hasAcceptedTermsAndConditions,
                locale,
            });

            response.status(201).json(registrationResult);
        } catch (error) {
            next(error);
        }
    }

    async adminApproveUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getUuidParam(request.params.userId);
            const { roleLabels } = request.body;

            if (!roleLabels || !Array.isArray(roleLabels)) {
                throw new CustomError('Un tableau de labels de rôles est requis', 400);
            }

            const approvalResult = await AuthenticateService.adminApproveUser(userId, roleLabels);

            response.status(200).json(approvalResult);
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthenticateController();
