import { Request, Response, NextFunction } from 'express';
import { User, Role } from '../models/relations';
import { CustomError } from '../errors/CustomError';
import { sendPasswordResetEmail } from '../mailing/sendPasswordResetMail';
import AuthenticateService from '../services/AuthenticateService';
import { generateRandomToken } from '../utils/token';
import envVars from '../config/envValidation';
import { getUuidParam } from '../utils/request';

class AuthenticateController {
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
            const { email } = request.body;

            if (!email) {
                throw new CustomError('Un email est requis.', 400);
            }

            const user = await User.findOne({
                where: { email },
            });

            if (user) {
                const resetToken = generateRandomToken();

                const resetLink = `${envVars.FRONTEND_URL}/password-reset/${resetToken}`;

                await sendPasswordResetEmail(
                    { id: user.id, email: user.email ?? '' },
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
            const { password, confirmPassword } = request.body;

            if (!password || !confirmPassword) {
                throw new CustomError('Le mot de passe et la confirmation du mot de passe sont requis.', 400);
            }

            if (password !== confirmPassword) {
                throw new CustomError('Les mots de passe ne correspondent pas.', 400);
            }

            const user = await User.findByPk(userId);

            if (!user) {
                throw new CustomError('L\'utilisateur n\'a pas été trouvé.', 404);
            }

            await AuthenticateService.updatePassword(user, password);

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
            const { email, password, username, hasAcceptedTermsAndConditions } = request.body;

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
                hasAcceptedTermsAndConditions
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
