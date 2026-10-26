import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { CustomError } from '../errors/CustomError';
import { sendCreateUserByAdminEmail } from '../mailing/sendCreateUserByAdminMail';
import { sendPasswordResetEmail } from '../mailing/sendPasswordResetMail';
import User from '../models/UserModel';
import UserService from '../services/UserService';
import { generateRandomToken, hashToken } from '../utils/token';
import envVars from '../config/envValidation';
import { getStringParam, getUuidParam } from '../utils/request';

class UserController {
    async searchUsers(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const parseBool = (value: unknown): boolean | undefined => {
                if (value === 'true' || value === true) return true;
                if (value === 'false' || value === false) return false;
                return undefined;
            };
            const filters = {
                q: (request.query.q as string | undefined)
                    ?? (request.query.username as string | undefined),
                is_active: parseBool(request.query.is_active),
                is_banned: parseBool(request.query.is_banned),
                role: request.query.role as string | undefined,
                page: request.query.page ? parseInt(request.query.page as string) : 1,
                size: request.query.size ? parseInt(request.query.size as string) : 10
            };
            const users = await UserService.searchUsers(filters);
            response.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async listRoles(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const roles = await UserService.listRoles();
            response.status(200).json(roles);
        } catch (error) {
            next(error);
        }
    }

    async getUsers(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const users = await UserService.getUsers();
            response.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async getUserById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const user = await UserService.getUserById(id);
            response.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async getUserByResetPassword(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const token = getStringParam(request.params.token);
            const user = await UserService.getUserByResetPassword(token);
            response.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async getNewUsers(_request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const users = await UserService.getNewUsers();
            response.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async createUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        const { username, email } = request.body;

        try {
            if (!username || !email) {
                throw new CustomError('Le nom d\'utilisateur et l\'adresse e-mail sont obligatoires.', 400);
            }

            await User.emailAlreadyUsed(email);

            const createToken = generateRandomToken();

            const userPayload = {
                email,
                username,
                is_active: true,
                reset_password_token: hashToken(createToken)
            };

            await UserService.createUser(userPayload);

            await sendCreateUserByAdminEmail(email, username, createToken);

            response.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
            });
        } catch (error) {
            next(error);
        }
    }

    async createUserByAdmin(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const {
                email,
                username,
                roles,
                termsLink,
                password,
                send_invite_email,
                is_active,
                is_banned,
                biography,
                country,
                loved_archetype_id,
            } = request.body;

            if (!email || !username) {
                throw new CustomError('Le nom d\'utilisateur et l\'adresse e-mail sont obligatoires.', 400);
            }

            await User.emailAlreadyUsed(email);

            const hasPassword = typeof password === 'string' && password.trim().length > 0;
            const shouldSendInvite =
                send_invite_email === true || (!hasPassword && send_invite_email !== false);

            if (!hasPassword && !shouldSendInvite) {
                throw new CustomError(
                    'Fournissez un mot de passe ou activez l\'envoi d\'invitation par email.',
                    400
                );
            }

            const resetToken = shouldSendInvite ? generateRandomToken() : null;

            const userPayload = {
                email,
                username,
                password: hasPassword ? String(password).trim() : undefined,
                is_active: typeof is_active === 'boolean' ? is_active : true,
                is_banned: typeof is_banned === 'boolean' ? is_banned : false,
                has_accepted_terms_and_conditions: false,
                reset_password_token: resetToken ? hashToken(resetToken) : null,
                biography,
                country,
                loved_archetype_id,
            };

            const createdUser = await UserService.createUserByAdmin(userPayload, roles || []);

            if (shouldSendInvite && resetToken) {
                const termsUrl = termsLink || `${envVars.FRONTEND_URL}/terms-and-conditions`;
                await sendCreateUserByAdminEmail(email, username, resetToken, termsUrl);
            }

            response.status(201).json({
                success: true,
                message: shouldSendInvite
                    ? 'Utilisateur créé. Un email d\'invitation a été envoyé.'
                    : 'Utilisateur créé avec un mot de passe initial.',
                data: {
                    id: createdUser.id,
                    email: createdUser.email,
                    username: createdUser.username
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async switchIsActive(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const existingUser = await User.findByPk(id);

            if (existingUser) {
                await UserService.switchIsActive(existingUser);
                response.status(200).json({
                    message: 'Utilisateur modifié !'
                });
            }
        } catch (error) {
            next(error);
        }
    }

    async switchIsBanned(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const existingUser = await User.findByPk(id);

            if (existingUser) {
                await UserService.switchIsBanned(existingUser);
                response.status(200).json({
                    message: 'Utilisateur modifié !'
                });
            }
        } catch (error) {
            next(error);
        }
    }

    async updateUserByAdmin(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const {
                username,
                email,
                roles,
                is_active,
                is_banned,
                biography,
                country,
                loved_archetype_id,
                password,
            } = request.body;

            const hasUpdatableField =
                username !== undefined ||
                email !== undefined ||
                roles !== undefined ||
                typeof is_active === 'boolean' ||
                typeof is_banned === 'boolean' ||
                biography !== undefined ||
                country !== undefined ||
                loved_archetype_id !== undefined ||
                (typeof password === 'string' && password.length > 0);

            if (!hasUpdatableField) {
                throw new CustomError('Au moins un champ doit être fourni', 400);
            }

            if (roles && (!Array.isArray(roles) || roles.length < 1)) {
                throw new CustomError('Au moins un rôle doit être fourni', 400);
            }

            const existingUser = await User.findByPk(id);
            if (!existingUser) {
                throw new CustomError('User not found', 404);
            }

            if (email && email !== existingUser.email) {
                const emailUsed = await User.findOne({
                    where: {
                        email: email,
                        id: { [Op.ne]: id }
                    }
                });
                if (emailUsed) {
                    throw new CustomError('Cet email est déjà utilisé', 400);
                }
            }

            await UserService.updateUserByAdmin(id, request.body, roles || []);

            response.status(200).json({
                success: true,
                message: 'Utilisateur mis à jour avec succès',
            });
        } catch (error) {
            next(error);
        }
    }

    async adminSendPasswordReset(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const userInfo = await UserService.adminSendPasswordReset(id);
            const user = await User.findByPk(id);
            if (!user || !user.email) {
                throw new CustomError('User not found', 404);
            }

            const resetToken = generateRandomToken();
            const resetLink = `${envVars.FRONTEND_URL}/password-reset/${resetToken}`;
            await sendPasswordResetEmail(
                { id: user.id, email: user.email, locale: user.locale },
                resetToken,
                resetLink
            );

            response.status(200).json({
                success: true,
                message: `Email de réinitialisation envoyé à ${userInfo.email}.`,
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserQuizSummary(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const limit = request.query.limit
                ? parseInt(String(request.query.limit), 10)
                : 20;
            const summary = await UserService.getUserQuizSummary(id, limit);
            response.status(200).json(summary);
        } catch (error) {
            next(error);
        }
    }

    async getUserTournamentsSummary(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const tournaments = await UserService.getUserTournamentsSummary(id);
            response.status(200).json({ tournaments });
        } catch (error) {
            next(error);
        }
    }

    async updateMyProfile(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const authUser = (request as Request & { user?: { id?: string } }).user;

            if (!authUser?.id || String(authUser.id) !== String(id)) {
                throw new CustomError('Non autorisé', 403);
            }

            const existingUser = await User.findByPk(id);

            if (!existingUser) {
                throw new CustomError('Utilisateur non trouvé', 404);
            }

            const { locale, biography, country, loved_archetype_id } = request.body;
            const updated = await UserService.updateMyProfile(existingUser, {
                locale,
                biography,
                country,
                loved_archetype_id,
            });

            response.status(200).json({
                success: true,
                message: 'Profil mis à jour',
                user: updated,
            });
        } catch (error) {
            next(error);
        }
    }

    async changeMyPassword(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const authUser = (request as Request & { user?: { id?: string } }).user;

            if (!authUser?.id || String(authUser.id) !== String(id)) {
                throw new CustomError('Non autorisé', 403);
            }

            const existingUser = await User.findByPk(id);

            if (!existingUser) {
                throw new CustomError('Utilisateur non trouvé', 404);
            }

            const { currentPassword, password, confirmPassword } = request.body;
            await UserService.changeMyPassword(existingUser, {
                currentPassword,
                password,
                confirmPassword,
            });

            response.status(200).json({
                success: true,
                message: 'Mot de passe mis à jour avec succès',
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const existingUser = await User.findByPk(id);
            if (!existingUser) {
                throw new CustomError('Utilisateur non trouvé', 404);
            }

            await UserService.deleteUser(id);
            response.status(200).json({
                message: 'L\'utilisateur a été supprimé'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
