import { User, Role, Archetype } from '../models/relations';
import { CustomError } from '../errors/CustomError';
import { Op, WhereOptions } from 'sequelize';
import sequelize from '../config/Sequelize';
import { hashToken } from '../utils/token';
import { sendAccountApprovedEmail } from '../mailing/sendAccountApprovedMail';
import logger from '../utils/logger';

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

    static async getUserById(id: string): Promise<Record<string, unknown>> {
        const user = await User.findOne({
            where: {
                id: id
            },
            attributes: {
                exclude: ['password', 'reset_password_token'],
            },
            include: [
                {
                    model: Role,
                    as: 'roles',
                    through: {
                        attributes: []
                    }
                },
                {
                    model: Archetype,
                    as: 'loved_archetype',
                    attributes: ['id', 'name', 'slug', 'card_img_url', 'is_active'],
                    required: false,
                },
            ]
        });

        if (!user) {
            throw new CustomError('User not found', 404);
        }

        const userData = user.toJSON() as User & {
            roles?: Role[];
            loved_archetype?: { id: number; name: string } | null;
        };
        const roles = userData.roles ? userData.roles.map(role => role.label) : [];

        return { ...userData, roles };
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

            // Activation admin (toggle) : même mail que la route approve-user
            if (!existingUser.is_active && updatedUser.email) {
                try {
                    await sendAccountApprovedEmail({
                        id: updatedUser.id,
                        email: updatedUser.email,
                        username: updatedUser.username || undefined,
                        locale: updatedUser.locale,
                    }, ['User']);
                } catch (emailError) {
                    logger.logError(
                        'Compte activé mais échec envoi email d\'approbation',
                        emailError instanceof Error ? emailError : null,
                        { userId: updatedUser.id, email: updatedUser.email }
                    );
                }
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

    static async updateMyProfile(
        existingUser: User,
        data: {
            locale?: string;
            biography?: string | null;
            country?: string | null;
            loved_archetype_id?: number | string | null;
        }
    ): Promise<Record<string, unknown>> {
        if (data.locale !== undefined) {
            const locale = String(data.locale).trim().toLowerCase();
            if (locale !== 'fr' && locale !== 'en') {
                throw new CustomError('Locale must be fr or en', 400);
            }
            existingUser.locale = locale;
        }

        if (data.biography !== undefined) {
            const biography = data.biography === null ? null : String(data.biography).trim();
            if (biography && biography.length > 2000) {
                throw new CustomError('La biographie ne peut pas dépasser 2000 caractères.', 400);
            }
            existingUser.biography = biography || null;
        }

        if (data.country !== undefined) {
            if (data.country === null || data.country === '') {
                existingUser.country = null;
            } else {
                const country = String(data.country).trim().toUpperCase();
                if (!/^[A-Z]{2}$/.test(country)) {
                    throw new CustomError('Le pays doit être un code ISO 3166-1 alpha-2 (ex. FR).', 400);
                }
                existingUser.country = country;
            }
        }

        if (data.loved_archetype_id !== undefined) {
            if (data.loved_archetype_id === null || data.loved_archetype_id === '') {
                existingUser.loved_archetype_id = null;
            } else {
                const archetypeId = Number(data.loved_archetype_id);
                if (!Number.isFinite(archetypeId)) {
                    throw new CustomError('Archétype préféré invalide.', 400);
                }
                const archetype = await Archetype.findByPk(archetypeId);
                if (!archetype) {
                    throw new CustomError('Archétype introuvable.', 404);
                }
                existingUser.loved_archetype_id = archetypeId;
            }
        }

        await existingUser.save();
        return this.getUserById(existingUser.id);
    }

    static async changeMyPassword(
        existingUser: User,
        data: {
            currentPassword?: string;
            password?: string;
            confirmPassword?: string;
        }
    ): Promise<void> {
        const { currentPassword, password, confirmPassword } = data;

        if (!currentPassword || !password || !confirmPassword) {
            throw new CustomError(
                'Le mot de passe actuel, le nouveau mot de passe et la confirmation sont requis.',
                400
            );
        }

        if (password !== confirmPassword) {
            throw new CustomError('Les mots de passe ne correspondent pas.', 400);
        }

        if (password.length < 8) {
            throw new CustomError('Le nouveau mot de passe doit contenir au moins 8 caractères.', 400);
        }

        if (!existingUser.password) {
            throw new CustomError('Aucun mot de passe n\'est défini pour ce compte.', 400);
        }

        const isValid = await User.validPassword(existingUser.password, currentPassword);
        if (!isValid) {
            throw new CustomError('Le mot de passe actuel est incorrect.', 400);
        }

        existingUser.password = password;
        await existingUser.save();
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
