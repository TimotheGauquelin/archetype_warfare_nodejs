import { User, Deck } from '../models/relations.js';
import bcrypt from 'bcryptjs';
import { CustomError } from '../errors/CustomError.js';

class UserService {
    static async getAllUsers() {
        return User.findAll({
            include: [{ model: Deck }]
        });
    }

    static async getUserById(id) {
        const user = await User.findByPk(id, {
            include: [{ model: Deck }]
        });
        if (!user) {
            throw new CustomError('User not found', 404);
        }
        return user;
    }

    static async getUserByResetPassword(token, next) {
        try {
            const user = await User.findOne(
                {
                    where: {
                        reset_password_token: token
                    }
                }
            );
            console.log(user);
            if (!user) {
                throw new CustomError('User not found', 404);
            }
            return user;
        } catch (error) {
            next(error)
        }
    }

    static async updateResetPasswordToken(user, resetToken, next) {
        try {
            const [updatedCount] = await User.update(
                { reset_password_token: resetToken },
                {
                    where: {
                        id: user.id
                    }
                }
            );
    
            if (updatedCount === 0) {
                throw new CustomError('User not found', 404);
            }

            return user;
        } catch (error) {
            next(error)
        }
    }

}

export default UserService; 