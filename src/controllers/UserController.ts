import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { CustomError } from '../errors/CustomError';
import { sendCreateUserByAdminEmail } from '../mailing/sendCreateUserByAdminMail';
import User from '../models/UserModel';
import UserService from '../services/UserService';
import { generateRandomToken, hashToken } from '../utils/token';
import envVars from '../config/envValidation';
import { getStringParam, getUuidParam } from '../utils/request';

class UserController {
    async searchUsers(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                username: request.query.username as string | undefined,
                page: request.query.page ? parseInt(request.query.page as string) : 1,
                size: request.query.size ? parseInt(request.query.size as string) : 10
            };
            const users = await UserService.searchUsers(filters);
            response.status(200).json(users);
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
            const { email, username, roles, termsLink } = request.body;

            if (!email || !username) {
                throw new CustomError('Le nom d\'utilisateur et l\'adresse e-mail sont obligatoires.', 400);
            }

            await User.emailAlreadyUsed(email);

            const resetToken = generateRandomToken();

            const userPayload = {
                email,
                username,
                is_active: true,
                has_accepted_terms_and_conditions: false,
                reset_password_token: hashToken(resetToken)
            };

            const createdUser = await UserService.createUserByAdmin(userPayload, roles || []);

            const termsUrl = termsLink || `${envVars.FRONTEND_URL}/terms-and-conditions`;
            await sendCreateUserByAdminEmail(email, username, resetToken, termsUrl);

            response.status(201).json({
                success: true,
                message: 'Utilisateur créé par un administrateur.',
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
            const { username, email, roles } = request.body;

            if (!username && !email && !roles) {
                throw new CustomError('Au moins un champ (username, email ou roles) doit être fourni', 400);
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

    async updateMyProfile(request: Request, _response: Response, next: NextFunction): Promise<void> {
        try {
            const id = getUuidParam(request.params.id);
            const { myBelovedArchetype: _myBelovedArchetype } = request.body;

            const existingUser = await User.findByPk(id);

            if (!existingUser) {
                throw new CustomError('Utilisateur non trouvé', 404);
            }

            // await UserService.updateMyProfile(myBelovedArchetype);
            // response.status(200).json({
            //     message: 'Utilisateur modifié !'
            // });

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
