import { User, Role } from '../models/relations';
import { CustomError } from '../errors/CustomError';
import { Op, WhereOptions } from 'sequelize';
import sequelize from '../config/Sequelize';
import { hashToken } from '../utils/token';

interface SearchFilters {
    username?: string;
    page?: number;
    size?: number;
}

interface PaginatedResult<T> {
    data: T[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
}

interface UserPayload {
    username?: string;
    email?: string;
    password?: string;
    is_active?: boolean;
    is_banned?: boolean;
    has_accepted_terms_and_conditions?: boolean;
}

class UserService {
    static async searchUsers(filters: SearchFilters = {}): Promise<PaginatedResult<User>> {
        const { username, page = 1, size = 10 } = filters;

        const limit = parseInt(String(size));
        const offset = (parseInt(String(page)) - 1) * limit;

        const where: WhereOptions = {};

        if (username) {
            where.username = {
                [Op.iLike]: `%${username}%`
            };
        }

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

        return {
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(String(page)),
                pageSize: limit
            }
        };
    }

    static async getUsers(): Promise<User[]> {
        return User.findAll();
    }

    static async getUserById(id: string): Promise<User & { roles: string[] }> {
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

        const userData = user.toJSON() as User & { roles: Role[] };
        const roles = userData.roles ? userData.roles.map(role => role.label) : [];

        return { ...userData, roles } as User & { roles: string[] };
    }

    static async getUserByResetPassword(token: string): Promise<User> {
        const hashedToken = hashToken(token);
        const user = await User.findOne({
            where: {
                reset_password_token: hashedToken
            }
        });

        if (!user) {
            throw new CustomError('User not found', 404);
        }

        return user;
    }

    static async getNewUsers(): Promise<User[]> {
        const users = await User.findAll({
            where: {
                is_active: false,
                is_banned: false,
                created_at: { [Op.gte]: new Date(Date.now() - 1000 * 60 * 60 * 24) },
                [Op.and]: [
                    sequelize.literal(`(
                        SELECT COUNT(*) 
                        FROM "user_role" 
                        WHERE "user_role"."user_id" = "User"."id"
                    ) = 0`)
                ]
            },
            include: [
                {
                    model: Role,
                    as: 'roles',
                    required: false,
                    through: {
                        attributes: []
                    }
                }
            ]
        });

        return users;
    }

    static async updateResetPasswordToken(user: User, resetToken: string): Promise<User> {
        const hashedToken = hashToken(resetToken);
        const [updatedCount] = await User.update(
            { reset_password_token: hashedToken },
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
    }

    static async switchIsActive(existingUser: User): Promise<User> {
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
        if (!updatedUser) {
            throw new CustomError('User not found after update', 404);
        }

        if (nextIsActive) {
            const [role] = await Role.findOrCreate({
                where: { label: 'User' },
                defaults: { label: 'User' }
            });

            const alreadyHas = await (updatedUser as any).hasRole(role);
            if (!alreadyHas) {
                await (updatedUser as any).addRole(role);
            }
        }

        return updatedUser;
    }

    static async switchIsBanned(existingUser: User): Promise<void> {
        const [updatedCount] = await User.update(
            { is_banned: !existingUser.is_banned },
            { where: { id: existingUser.id } }
        );

        if (updatedCount === 0) {
            throw new CustomError('User not found', 404);
        }
    }

    static async updateMyProfile(_existingUser: User, _myBelovedArchetype: number): Promise<void> {
        // const [updatedCount] = await User.update(
        //     { beloved_archetype_id: myBelovedArchetype },
        //     { where: { id: existingUser.id } }
        // );

        // if (updatedCount === 0) {
        //     throw new CustomError('User not found', 404);
        // }
    }



    static async createUser(userPayload: UserPayload): Promise<User> {
        return User.create({
            ...userPayload,
            is_banned: userPayload.is_banned ?? false,
            is_active: userPayload.is_active ?? false,
            has_accepted_terms_and_conditions: userPayload.has_accepted_terms_and_conditions ?? false
        });
    }

    static async createUserByAdmin(userPayload: UserPayload, roleLabels: string[] = []): Promise<User> {
        const user = await User.create({
            ...userPayload,
            is_banned: userPayload.is_banned ?? false,
            is_active: userPayload.is_active ?? false,
            has_accepted_terms_and_conditions: userPayload.has_accepted_terms_and_conditions ?? false
        });

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

            await (user as any).setRoles(roles);
        } else {
            const [defaultRole] = await Role.findOrCreate({
                where: { label: 'User' },
                defaults: { label: 'User' }
            });
            await (user as any).addRole(defaultRole);
        }

        return user;
    }

    static async updateUserByAdmin(userId: string, userPayload: UserPayload, roleLabels: string[] = []): Promise<User> {
        const { username, email } = userPayload;

        const updateData: Partial<UserPayload> = {};
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
            if (!updatedUser) {
                throw new CustomError('User not found', 404);
            }
            await (updatedUser as any).setRoles(roles);
        }

        const updatedUser = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] }
            }]
        });

        if (!updatedUser) {
            throw new CustomError('User not found', 404);
        }

        return updatedUser;
    }

    static async deleteUser(userId: string): Promise<void> {
        await User.destroy({ where: { id: userId } });
    }
}

export default UserService;
