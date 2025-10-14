import { User, Deck, Role } from '../models/relations.js';
import { CustomError } from '../errors/CustomError.js';
import { Op } from 'sequelize';

class UserService {
    static async searchUsers(request, next) {
        const { username, page = 1, size = 10 } = request.query;

        const limit = parseInt(size);
        const offset = (parseInt(page) - 1) * limit;

        const where = {};

        if (username) {
            where.username = {
                [Op.iLike]: `%${username}%`
            };
        }

        try {
            const { count, rows } = await User.findAndCountAll({
                where,
                limit,
                offset,
                distinct: true,
                col: 'id',
                subQuery: false,
                order: [['id', 'DESC']],
                include: [
                    {
                        model: Role,
                        as: 'roles',
                        through: {
                            attributes: []
                        }
                    }
                ]
            });

            console.log("count===", count);
            console.log("row===", rows);

            return {
                data: rows,
                pagination: {
                    totalItems: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: parseInt(page),
                    pageSize: limit
                }
            };
        } catch (error) {
            next(error);
        }

    }

    static async getUsers(next) {
        try {
            return User.findAll();
        } catch (error) {
            next(error);
        }
    }

    static async getUserById(request, response, next) {
        const { id } = request.params;
        try {
            const user = await User.findOne({
                where: {
                    id: id
                },
                include: [
                    {
                        model: Role,
                        as: 'roles',
                        through: {
                            attributes: []
                        }
                    }
                ]
            });
            if (!user) {
                throw new CustomError('User not found', 404);
            }

            const userData = user.toJSON();
            userData.roles = userData.roles ? userData.roles.map(role => role.label) : [];

            return userData;
        } catch (error) {
            next(error);
        }
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
            if (!user) {
                throw new CustomError('User not found', 404);
            }
            return user;
        } catch (error) {
            next(error);
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
            next(error);
        }
    }

    static async switchIsActive(existingUser, next) {
        try {
            const targetId = existingUser.id;
            const nextIsActive = !Boolean(existingUser.is_active);

            const [updatedCount] = await User.update(
                { is_active: nextIsActive },
                { where: { id: targetId } }
            );

            if (updatedCount === 0) {
                throw new CustomError('User not found', 404);
            }

            const updatedUser = await User.findByPk(targetId);

            if (nextIsActive) {
                // Associer le rôle 'User' si l'utilisateur vient d'être activé
                const [role] = await Role.findOrCreate({
                    where: { label: 'User' },
                    defaults: { label: 'User' }
                });

                const alreadyHas = await updatedUser.hasRole(role);
                if (!alreadyHas) {
                    await updatedUser.addRole(role);
                }
            }

            return updatedUser;
        } catch (error) {
            next(error);
        }
    }

    static async switchIsBanned(existingUser, next) {
        try {
            const user = await User.update(
                { is_banned: !existingUser.is_banned },
                { where: { id: existingUser.id } }
            );
            if (user === 0) {
                throw new CustomError('User not found', 404);
            }
        } catch (error) {
            next(error);
        }
    }

    static async createUser(userPayload, next) {
        try {
            await User.create(userPayload);
        } catch (error) {
            next(error);
        }
    }

    static async createUserByAdmin(userPayload, roleLabels, next) {
        try {
            const user = await User.create(userPayload);

            if (Array.isArray(roleLabels) && roleLabels.length > 0) {
                const roles = await Promise.all(
                    roleLabels.map(async (label) => {
                        const [role] = await Role.findOrCreate({
                            where: { label },
                            defaults: { label }
                        });
                        return role;
                    })
                );

                await user.setRoles(roles);
            } else {
                const [defaultRole] = await Role.findOrCreate({
                    where: { label: 'User' },
                    defaults: { label: 'User' }
                });
                await user.addRole(defaultRole);
            }

            return user;
        } catch (error) {
            next(error);
        }
    }

    static async updateUserByAdmin(userId, userPayload, roleLabels = [], next) {
        try {
            const { username, email } = userPayload;

            const updateData = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;

            await User.update(updateData, { where: { id: userId } });

            if (Array.isArray(roleLabels)) {
                const roles = await Promise.all(
                    roleLabels.map(async (label) => {
                        const [role] = await Role.findOrCreate({
                            where: { label },
                            defaults: { label }
                        });
                        return role;
                    })
                );

                const updatedUser = await User.findByPk(userId);
                await updatedUser.setRoles(roles);
            }

            return await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'roles',
                    through: { attributes: [] }
                }]
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteUser(userId, next) {
        try {
            await User.destroy({ where: { id: userId } });
        } catch (error) {
            next(error);
        }
    }

}

export default UserService; 