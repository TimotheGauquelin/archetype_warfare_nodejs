import { Op } from 'sequelize';
import { CustomError } from '../errors/CustomError.js';
import { sendCreateUserByAdminEmail } from '../mailing/sendCreateUserByAdminMail.js';
import User from '../models/UserModel.js';
import UserService from '../services/UserService.js';
import { generateRandomToken } from '../utils/token.js';

class UserController {
    async searchUsers(request, response, next) {
        try {
            const users = await UserService.searchUsers(request, next);
            return response.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async getUsers(request, response) {
        try {
            const users = await UserService.getUsers(request, response);
            return response.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async getUserById(request, response, next) {
        try {
            const user = await UserService.getUserById(request, response, next);
            return response.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }
    async getUsers(request, response) {
        try {
            const users = await UserService.getUsers(request, response);
            return response.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async getUserByResetPassword(request, response, next) {
        try {
            const { token } = request.params;

            const user = await UserService.getUserByResetPassword(token, next);
            return response.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    // POST

    async createUser(request, response, next) {

        const { username, email } = request.body;

        try {

            if (!username || !email) {
                throw new CustomError('Le nom d\'utilisateur et l\'adresse e-mail sont obligatoires.', 400);
            }

            const user = await User.emailAlreadyUsed(email, next);
            if (user) {
                throw new CustomError('Email already used', 400);
            }

            const createToken = generateRandomToken();

            const userPayload = {
                email,
                username,
                is_active: true,
                reset_password_token: createToken
            };

            await UserService.createUser(userPayload, next);

            await sendCreateUserByAdminEmail(email, username, createToken);

            return response.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
            });

        } catch (error) {
            next(error);
        }
    }

    async createUserByAdmin(request, response, next) {
        try {
            const { email, username, roles, termsLink } = request.body;

            if (!email || !username) {
                throw new CustomError('Le nom d\'utilisateur et l\'adresse e-mail sont obligatoires.', 400);
            }

            const emailUsed = await User.emailAlreadyUsed(email, next);
            if (emailUsed) {
                throw new CustomError('Email already used', 400);
            }

            const resetToken = generateRandomToken();

            const userPayload = {
                email,
                username,
                is_active: true,
                has_accepted_terms_and_conditions: false,
                reset_password_token: resetToken
            };

            const createdUser = await UserService.createUserByAdmin(userPayload, roles, next);

            const termsUrl = termsLink || `${process.env.FRONTEND_URL}/terms-and-conditions`;
            await sendCreateUserByAdminEmail(email, username, resetToken, termsUrl);

            return response.status(201).json({
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

    // PUT 

    async switchIsActive(request, response, next) {

        const { id } = request.params;

        try {

            const existingUser = await User.findByPk(id);

            if (existingUser) {
                await UserService.switchIsActive(existingUser.dataValues, next);
                return response.status(200).json({
                    message: 'Utilisateur modifié !'
                });
            }

        } catch (error) {
            response.status(500).json({ message: error.message });
        }
    }

    async switchIsBanned(request, response, next) {

        const { id } = request.params;

        try {

            const existingUser = await User.findByPk(id);

            if (existingUser) {
                await UserService.switchIsBanned(existingUser.dataValues, next);
                return response.status(200).json({
                    message: 'Utilisateur modifié !'
                });
            }

        } catch (error) {
            response.status(500).json({ message: error.message });
        }
    }

    async updateUserByAdmin(request, response, next) {
        try {
            const { id } = request.params;
            const { username, email, roles } = request.body;

            if (!username && !email && !roles) {
                throw new CustomError('Au moins un champ (username, email ou roles) doit être fourni', 400);
            }

            if (roles.length < 1) {
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

            await UserService.updateUserByAdmin(id, request.body, roles, next);

            return response.status(200).json({
                success: true,
                message: 'Utilisateur mis à jour avec succès',
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(request, response, next) {

        const { id } = request.params;

        try {

            const existingUser = await User.findByPk(id);
            if (!existingUser) {
                throw new CustomError('Utilisateur non trouvé', 404);
            }

            await UserService.deleteUser(id, next);
            return response.status(200).json({
                message: 'L\'utilisateur a été supprimé'
            });

        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();