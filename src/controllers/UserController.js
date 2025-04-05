import { CustomError } from "../errors/CustomError.js";
import User from "../models/UserModel.js";
import UserService from "../services/UserService.js";

class UserController {
    async searchUsers(request, response) {

        try {

            const users = await UserService.searchUsers(request, response)
            return response.status(200).json(users)

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async getUsers(request, response) {
        try {
            const users = await UserService.getUsers(request, response)
            return response.status(200).json(users)
        } catch (error) {
            next(error)
        }
    }

    async getUserByResetPassword(request, response, next) {
        try {
            const { token } = request.params

            const user = await UserService.getUserByResetPassword(token, next)
            return response.status(200).json(user)
        } catch (error) {
            next(error)
        }
    }

    // POST

    async createUser(request, response, next) {

        const { username, email } = request.body

        try {

            if (!username || !email) {
                throw new CustomError("Le nom d'utilisateur et l'adresse e-mail sont obligatoires.", 400);
            }

            await User.validEmail(email);

            await UserService.createUser(request.body, next)

            return response.status(201).json({
                success: true,
                message: "Utilisateur créé avec succès",
            })

        } catch (error) {
            next(error)
        }
    }

    // PUT 

    async switchIsActive(request, response) {

        const { userId } = request.params

        try {

            const isExist = User.findByPk(userId)

            if (isExist) {
                const user = await UserService.switchIsActive(request, response)
                return user
            }

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async switchIsForbidden(request, response) {

        const { userId } = request.params

        try {

            const isExist = User.findByPk(userId)

            if (isExist) {
                const user = await UserService.switchIsForbidden(request, response)
                return user
            }

        } catch (error) {

            response.status(500).json({ message: error.message });

        }
    }

    async deleteUser(request, response, next) {

        const { userId } = request.params

        try {

            await User.findByPk(userId)

            await UserService.deleteUser(request, response, next)
            return response.status(200).json({
                message: "L'utilisateur a été supprimé"
            });

        } catch (error) {
            next(error);
        }
    }
}

export default new UserController()