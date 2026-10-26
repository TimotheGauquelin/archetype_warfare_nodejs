import {
    User,
    Role,
    Archetype,
    QuizAttempt,
    QuizTheme,
    Tournament,
    TournamentPlayer,
    TournamentPlayerDeck,
} from '../models/relations';
import { CustomError } from '../errors/CustomError';
import { Op, WhereOptions } from 'sequelize';
import sequelize from '../config/Sequelize';
import { hashToken } from '../utils/token';
import { sendAccountApprovedEmail } from '../mailing/sendAccountApprovedMail';
import logger from '../utils/logger';

interface SearchFilters {
    /** Recherche libre sur username et/ou email */
    q?: string;
    username?: string;
    is_active?: boolean;
    is_banned?: boolean;
    role?: string;
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
    biography?: string | null;
    country?: string | null;
    loved_archetype_id?: number | string | null;
    reset_password_token?: string | null;
}

class UserService {
    static async listRoles(): Promise<Role[]> {
        return Role.findAll({
            attributes: ['id', 'label'],
            order: [['label', 'ASC']],
        });
    }

    static async searchUsers(filters: SearchFilters = {}): Promise<PaginatedResult<User>> {
        const {
            q,
            username,
            is_active,
            is_banned,
            role,
            page = 1,
            size = 10,
        } = filters;

        const limit = parseInt(String(size));
        const offset = (parseInt(String(page)) - 1) * limit;

        const where: WhereOptions = {};
        const search = (q ?? username)?.trim();
        if (search) {
            Object.assign(where, {
                [Op.or]: [
                    { username: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } },
                ],
            });
        }
        if (typeof is_active === 'boolean') {
            where.is_active = is_active;
        }
        if (typeof is_banned === 'boolean') {
            where.is_banned = is_banned;
        }

        const roleLabel = role?.trim();
        const { count, rows } = await User.findAndCountAll({
            where,
            limit,
            offset,
            distinct: true,
            col: 'id',
            subQuery: false,
            order: [['created_at', 'DESC'], ['id', 'DESC']],
            include: [
                {
                    model: Role,
                    as: 'roles',
                    through: {
                        attributes: []
                    },
                    ...(roleLabel
                        ? {
                            where: { label: roleLabel },
                            required: true,
                        }
                        : {}),
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
            username: userPayload.username,
            email: userPayload.email,
            password: userPayload.password,
            reset_password_token: userPayload.reset_password_token ?? null,
            is_banned: userPayload.is_banned ?? false,
            is_active: userPayload.is_active ?? false,
            has_accepted_terms_and_conditions: userPayload.has_accepted_terms_and_conditions ?? false
        });
    }

    static async createUserByAdmin(userPayload: UserPayload, roleLabels: string[] = []): Promise<User> {
        if (userPayload.password !== undefined && userPayload.password !== '') {
            if (String(userPayload.password).length < 8) {
                throw new CustomError('Le mot de passe doit contenir au moins 8 caractères.', 400);
            }
        }

        const user = await User.create({
            username: userPayload.username,
            email: userPayload.email,
            password: userPayload.password || null,
            reset_password_token: userPayload.reset_password_token ?? null,
            is_banned: userPayload.is_banned ?? false,
            is_active: userPayload.is_active ?? true,
            has_accepted_terms_and_conditions: userPayload.has_accepted_terms_and_conditions ?? false,
        });

        await this.applyProfileFields(user, {
            biography: userPayload.biography,
            country: userPayload.country,
            loved_archetype_id: userPayload.loved_archetype_id,
        });
        await user.save();

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

    static async applyProfileFields(
        existingUser: User,
        data: {
            biography?: string | null;
            country?: string | null;
            loved_archetype_id?: number | string | null;
        }
    ): Promise<void> {
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
    }

    static async updateUserByAdmin(userId: string, userPayload: UserPayload, roleLabels: string[] = []): Promise<User> {
        const existingUser = await User.findByPk(userId);
        if (!existingUser) {
            throw new CustomError('User not found', 404);
        }

        if (userPayload.username !== undefined && userPayload.username !== '') {
            existingUser.username = String(userPayload.username).trim();
        }
        if (userPayload.email !== undefined && userPayload.email !== '') {
            existingUser.email = String(userPayload.email).trim();
        }
        if (typeof userPayload.is_active === 'boolean') {
            existingUser.is_active = userPayload.is_active;
        }
        if (typeof userPayload.is_banned === 'boolean') {
            existingUser.is_banned = userPayload.is_banned;
        }
        if (userPayload.password !== undefined && userPayload.password !== '') {
            const password = String(userPayload.password);
            if (password.length < 8) {
                throw new CustomError('Le mot de passe doit contenir au moins 8 caractères.', 400);
            }
            existingUser.password = password;
            existingUser.reset_password_token = null;
        }

        await this.applyProfileFields(existingUser, {
            biography: userPayload.biography,
            country: userPayload.country,
            loved_archetype_id: userPayload.loved_archetype_id,
        });

        await existingUser.save();

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
            await (existingUser as any).setRoles(roles);
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

    static async adminSendPasswordReset(userId: string): Promise<{ email: string; username: string | null }> {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new CustomError('User not found', 404);
        }
        if (!user.email) {
            throw new CustomError('Cet utilisateur n\'a pas d\'email.', 400);
        }
        return {
            email: user.email,
            username: user.username,
        };
    }

    static async getUserTournamentsSummary(userId: string): Promise<
        Array<{
            tournament_id: string;
            name: string;
            status: string;
            event_date: string | Date | null;
            location: string | null;
            is_official: boolean;
            is_online: boolean;
            participation: {
                tournament_player_id: number;
                match_wins: number;
                match_losses: number;
                match_draws: number;
                dropped: boolean;
                disqualified_at: Date | null;
                deck_label: string | null;
                archetype_name: string | null;
                place: number | null;
                players_count: number;
            };
        }>
    > {
        const user = await User.findByPk(userId, { attributes: ['id'] });
        if (!user) {
            throw new CustomError('User not found', 404);
        }

        const participations = await TournamentPlayer.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Tournament,
                    as: 'tournament',
                    required: true,
                    attributes: [
                        'id',
                        'name',
                        'status',
                        'event_date',
                        'location',
                        'is_official',
                        'is_online',
                    ],
                },
                {
                    model: TournamentPlayerDeck,
                    as: 'deck_snapshot',
                    required: false,
                    attributes: ['id', 'label'],
                    include: [
                        {
                            model: Archetype,
                            as: 'archetype',
                            attributes: ['id', 'name'],
                            required: false,
                        },
                    ],
                },
            ],
            order: [[{ model: Tournament, as: 'tournament' }, 'event_date', 'DESC']],
        });

        const tournamentIds = Array.from(
            new Set(participations.map((tp) => tp.tournament_id as string))
        );

        const placeByTournamentPlayerId = new Map<
            number,
            { place: number; players_count: number }
        >();

        if (tournamentIds.length > 0) {
            const allPlayers = await TournamentPlayer.findAll({
                where: { tournament_id: tournamentIds },
                attributes: [
                    'id',
                    'tournament_id',
                    'match_wins',
                    'match_draws',
                    'games_won',
                ],
                order: [
                    ['tournament_id', 'ASC'],
                    ['match_wins', 'DESC'],
                    ['match_draws', 'DESC'],
                    ['games_won', 'DESC'],
                ],
            });

            const byTournament = new Map<string, typeof allPlayers>();
            for (const player of allPlayers) {
                const tid = player.tournament_id as string;
                if (!byTournament.has(tid)) byTournament.set(tid, []);
                byTournament.get(tid)!.push(player);
            }

            for (const players of byTournament.values()) {
                players.forEach((player, index) => {
                    placeByTournamentPlayerId.set(player.id, {
                        place: index + 1,
                        players_count: players.length,
                    });
                });
            }
        }

        return participations.map((tp) => {
            const tournament = (tp as unknown as {
                tournament?: {
                    id: string;
                    name: string;
                    status: string;
                    event_date: string | Date | null;
                    location: string | null;
                    is_official: boolean;
                    is_online: boolean;
                };
            }).tournament;
            const snapshot = (tp as unknown as {
                deck_snapshot?: {
                    label?: string | null;
                    archetype?: { id: number; name: string } | null;
                } | null;
            }).deck_snapshot;
            const ranking = placeByTournamentPlayerId.get(tp.id);
            const hasPlayed =
                tp.match_wins > 0 ||
                tp.match_losses > 0 ||
                tp.match_draws > 0 ||
                (tournament?.status === 'tournament_finished');

            return {
                tournament_id: tournament?.id ?? tp.tournament_id,
                name: tournament?.name ?? 'Tournoi',
                status: tournament?.status ?? '',
                event_date: tournament?.event_date ?? null,
                location: tournament?.location ?? null,
                is_official: Boolean(tournament?.is_official),
                is_online: Boolean(tournament?.is_online),
                participation: {
                    tournament_player_id: tp.id,
                    match_wins: tp.match_wins,
                    match_losses: tp.match_losses,
                    match_draws: tp.match_draws,
                    dropped: Boolean(tp.dropped),
                    disqualified_at: tp.disqualified_at,
                    deck_label: snapshot?.label ?? null,
                    archetype_name: snapshot?.archetype?.name ?? null,
                    place: hasPlayed ? ranking?.place ?? null : null,
                    players_count: ranking?.players_count ?? 0,
                },
            };
        });
    }

    static async getUserQuizSummary(userId: string, limit = 20): Promise<{
        quiz_points: number;
        attempts: Array<{
            id: string;
            mode: string;
            status: string;
            score: number;
            max_score: number;
            daily_date: string | null;
            started_at: Date | null | undefined;
            finished_at: Date | null;
            theme: { id: number; label: string; slug?: string } | null;
        }>;
    }> {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'quiz_points'],
        });
        if (!user) {
            throw new CustomError('User not found', 404);
        }

        const attempts = await QuizAttempt.findAll({
            where: { user_id: userId },
            order: [
                sequelize.literal('finished_at DESC NULLS LAST'),
                ['started_at', 'DESC'],
            ],
            limit: Math.min(Math.max(limit, 1), 50),
            include: [
                {
                    model: QuizTheme,
                    as: 'theme',
                    attributes: ['id', 'label', 'slug'],
                    required: false,
                },
            ],
        });

        return {
            quiz_points: user.quiz_points ?? 0,
            attempts: attempts.map((attempt) => {
                const theme = (attempt as unknown as {
                    theme?: { id: number; label: string; slug?: string } | null;
                }).theme;
                return {
                    id: attempt.id,
                    mode: attempt.mode,
                    status: attempt.status,
                    score: attempt.score,
                    max_score: attempt.max_score,
                    daily_date: attempt.daily_date,
                    started_at: attempt.started_at ?? null,
                    finished_at: attempt.finished_at,
                    theme: theme
                        ? { id: theme.id, label: theme.label, slug: theme.slug }
                        : null,
                };
            }),
        };
    }

    static async deleteUser(userId: string): Promise<void> {
        await User.destroy({ where: { id: userId } });
    }
}

export default UserService;
