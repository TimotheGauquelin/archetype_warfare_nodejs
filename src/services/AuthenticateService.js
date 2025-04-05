import { User } from '../models/relations.js';
import jwt from 'jsonwebtoken';
import { CustomError } from '../errors/CustomError.js';
import UserService from './UserService.js';

class AuthenticateService {
    static async register(userData) {
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw new CustomError('User with this email already exists', 400);
        }

        const user = await UserService.createUser(userData);
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email
            }
        };
    }

    static async updatePassword(user, password, next) {
        try {
            const [updatedCount] = await User.update(
                { password: password },
                {
                    where: {
                        id: user.id
                    }
                }
            )
            if (updatedCount === 0) {
                throw new CustomError('User not found', 404);
            }

            return user;
        } catch (error) {
            next(error)
        }
    }
}

export default AuthenticateService;
