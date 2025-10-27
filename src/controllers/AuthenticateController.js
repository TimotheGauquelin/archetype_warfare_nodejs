import { User, Role } from '../models/relations.js';
import { CustomError } from '../errors/CustomError.js';
import { sendPasswordResetEmail } from '../mailing/sendPasswordResetMail.js';
import AuthenticateService from '../services/AuthenticateService.js';
import { generateRandomToken } from '../utils/token.js';

class AuthenticateController {
    async login(request, result, next) {
        try {
            const { email, password } = request.body;

            if (!email || !password) {
                throw new CustomError('Vous devez écrire un email et un mot de passe', 400);
            }

            const user = await User.findOne({
                where: { email },
                include: [{
                    model: Role,
                    as: 'roles'
                }]
            });

            // Debug temporaire pour vérifier les rôles
            if (user) {
                console.log('Connexion utilisateur:', {
                    id: user.id,
                    email: user.email,
                    roles: user.roles?.map(r => r.label) || [],
                    rolesCount: user.roles?.length || 0
                });
            }

            if (!user) {
                throw new CustomError('Votre email ou votre mot de passe ne correspondent pas', 400);
            }

            const isValidPassword = await User.validPassword(user.password, password, next);

            if (!isValidPassword) {
                throw new CustomError('Votre email ou votre mot de passe ne correspondent pas', 400);
            }

            if (user.is_banned) {
                throw new CustomError('Votre compte est banni. Veuillez contacter un administrateur', 403);
            }

            if (!user.is_active) {
                throw new CustomError('Votre compte doit être validé par un administrateur', 400);
            }

            const token = await User.generateToken(user, next);

            return result.status(200).json({
                success: true,
                message: 'Connexion réussie !',
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    roles: user.roles ? user.roles.map(role => role.label) : []
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async requestNewPassword(request, result, next) {
        try {
            const { email } = request.body;

            if (!email) {
                throw new CustomError('Un email est requis.', 400);
            }

            const user = await User.findOne({
                where: { email },
            });

            if (!user) {
                throw new CustomError('Aucun utilisateur n\'a été trouvé avec cet email.', 404);
            }


            const resetToken = await generateRandomToken();

            const resetLink = `${process.env.FRONTEND_URL}/password-reset/${resetToken}`;

            await sendPasswordResetEmail(user, resetToken, resetLink, next);

            return result.status(200).json({
                success: true,
                message: 'Un email de réinitialisation a été envoyé.'
            });

        } catch (error) {
            next(error);
        }
    }

    async updatePassword(request, response, next) {
        const { userId } = request.params;
        const { password, confirmationPassword } = request.body;
        try {
            if (!password || !confirmationPassword) {
                throw new CustomError('Le mot de passe et la confirmation du mot de passe sont requis.', 400);
            }

            if (password !== confirmationPassword) {
                throw new CustomError('Les mots de passe ne correspondent pas.', 400);
            }

            const user = await User.findByPk(userId);

            if (!user) {
                throw new CustomError('L\'utilisateur n\'a pas été trouvé.', 404);
            }

            await AuthenticateService.updatePassword(user, password, next);

            return response.status(200).json({
                success: true,
                message: 'Le mot de passe a été mis à jour avec succès.'
            });

        } catch (error) {
            next(error);
        }
    }

    async register(request, result, next) {
        try {
            const { email, password, username } = request.body;

            if (!email || !password) {
                throw new CustomError('Email et mot de passe requis', 400);
            }

            const registrationResult = await AuthenticateService.register({
                email,
                password,
                username
            });

            return result.status(201).json({
                success: true,
                message: 'Inscription réussie !',
                ...registrationResult
            });

        } catch (error) {
            next(error);
        }
    }

    async adminApproveUser(request, result, next) {
        try {
            const { userId } = request.params;
            const { roleLabels } = request.body;

            if (!roleLabels || !Array.isArray(roleLabels)) {
                throw new CustomError('Un tableau de labels de rôles est requis', 400);
            }

            const approvalResult = await AuthenticateService.adminApproveUser(userId, roleLabels);

            return result.status(200).json(approvalResult);

        } catch (error) {
            next(error);
        }
    }
}

export default new AuthenticateController();