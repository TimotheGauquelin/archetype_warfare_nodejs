import envVars from '../config/envValidation';
import { CustomError } from '../errors/CustomError';
import { User, Role } from '../models/relations';
import sequelize from '../config/Sequelize';

type DiscordTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
};

type DiscordUser = {
    id: string;
    username: string;
    global_name?: string | null;
    email?: string | null;
    verified?: boolean;
};

type DiscordGuild = {
    id: string;
    name: string;
};

export type DiscordAuthResult =
    | { status: 'authenticated'; token: string; user: { id: string; email: string; username: string | null; roles: string[] } }
    | { status: 'pending_approval'; message: string }
    | { status: 'error'; message: string; code?: string };

class DiscordAuthService {
    static isConfigured(): boolean {
        return Boolean(
            envVars.DISCORD_CLIENT_ID
            && envVars.DISCORD_CLIENT_SECRET
            && envVars.DISCORD_REDIRECT_URI
            && envVars.DISCORD_GUILD_ID
        );
    }

    static assertConfigured(): void {
        if (!DiscordAuthService.isConfigured()) {
            throw new CustomError(
                'Connexion Discord non configurée (DISCORD_CLIENT_ID / SECRET / REDIRECT_URI / GUILD_ID).',
                503
            );
        }
    }

    static getAuthorizeUrl(state: string): string {
        DiscordAuthService.assertConfigured();
        const params = new URLSearchParams({
            client_id: envVars.DISCORD_CLIENT_ID!,
            redirect_uri: envVars.DISCORD_REDIRECT_URI!,
            response_type: 'code',
            scope: 'identify email guilds',
            state,
            prompt: 'consent',
        });
        return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }

    static async exchangeCode(code: string): Promise<DiscordTokenResponse> {
        DiscordAuthService.assertConfigured();
        const body = new URLSearchParams({
            client_id: envVars.DISCORD_CLIENT_ID!,
            client_secret: envVars.DISCORD_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            code,
            redirect_uri: envVars.DISCORD_REDIRECT_URI!,
        });

        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });

        if (!response.ok) {
            throw new CustomError('Échec de l\'échange du code Discord', 400);
        }

        return response.json() as Promise<DiscordTokenResponse>;
    }

    static async fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new CustomError('Impossible de récupérer le profil Discord', 400);
        }
        return response.json() as Promise<DiscordUser>;
    }

    static async isMemberOfRequiredGuild(accessToken: string, discordUserId: string): Promise<boolean> {
        const guildId = envVars.DISCORD_GUILD_ID!;

        // Préféré : liste des guilds de l'utilisateur (scope guilds)
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (guildsResponse.ok) {
            const guilds = (await guildsResponse.json()) as DiscordGuild[];
            if (guilds.some((guild) => String(guild.id) === String(guildId))) {
                return true;
            }
        }

        // Fallback bot (si configuré + Server Members Intent)
        if (envVars.DISCORD_BOT_TOKEN) {
            const memberResponse = await fetch(
                `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
                {
                    headers: { Authorization: `Bot ${envVars.DISCORD_BOT_TOKEN}` },
                }
            );
            if (memberResponse.ok) {
                return true;
            }
        }

        return false;
    }

    static buildUniqueUsername(base: string, discordId: string): string {
        const cleaned = (base || `discord${discordId.slice(-6)}`)
            .replace(/[^a-zA-Z0-9_]/g, '')
            .slice(0, 24);
        const withMin = cleaned.length >= 3 ? cleaned : `usr${cleaned}${discordId.slice(-3)}`;
        return withMin.slice(0, 30);
    }

    static async ensureUniqueUsername(base: string, discordId: string): Promise<string> {
        let candidate = DiscordAuthService.buildUniqueUsername(base, discordId);
        let suffix = 0;
        while (true) {
            const existing = await User.findOne({ where: { username: candidate } });
            if (!existing) {
                return candidate;
            }
            suffix += 1;
            const suffixStr = String(suffix);
            candidate = `${DiscordAuthService.buildUniqueUsername(base, discordId).slice(0, 30 - suffixStr.length)}${suffixStr}`;
        }
    }

    static async loginOrRegisterFromDiscord(
        discordUser: DiscordUser,
        options: { locale?: string; acceptedTerms?: boolean } = {}
    ): Promise<DiscordAuthResult> {
        const discordId = String(discordUser.id);
        const locale = options.locale === 'en' ? 'en' : 'fr';
        const email =
            discordUser.email?.trim()
            || `discord_${discordId}@users.noreply.discord.local`;

        const transaction = await sequelize.transaction();
        try {
            let user = await User.findOne({
                where: { discord_id: discordId },
                include: [{ model: Role, as: 'roles' }],
                transaction,
            });

            // Lier un compte local existant avec le même email
            if (!user && discordUser.email) {
                user = await User.findOne({
                    where: { email: discordUser.email.trim() },
                    include: [{ model: Role, as: 'roles' }],
                    transaction,
                });
                if (user) {
                    await user.update(
                        {
                            discord_id: discordId,
                            auth_provider: user.auth_provider === 'local' ? 'local+discord' : 'discord',
                        },
                        { transaction }
                    );
                }
            }

            if (!user) {
                if (!options.acceptedTerms) {
                    await transaction.rollback();
                    return {
                        status: 'error',
                        code: 'terms_required',
                        message: 'Vous devez accepter les conditions d\'utilisation pour créer un compte via Discord.',
                    };
                }

                const username = await DiscordAuthService.ensureUniqueUsername(
                    discordUser.global_name || discordUser.username,
                    discordId
                );

                user = await User.create(
                    {
                        username,
                        email,
                        password: null,
                        discord_id: discordId,
                        auth_provider: 'discord',
                        is_active: false,
                        is_banned: false,
                        has_accepted_terms_and_conditions: true,
                        locale,
                    },
                    { transaction }
                );

                await transaction.commit();
                return {
                    status: 'pending_approval',
                    message: 'Compte Discord créé. Il doit être approuvé par un administrateur avant connexion.',
                };
            }

            if (user.is_banned) {
                await transaction.rollback();
                return {
                    status: 'error',
                    code: 'banned',
                    message: 'Votre compte est banni. Veuillez contacter un administrateur.',
                };
            }

            if (!user.is_active) {
                await transaction.rollback();
                return {
                    status: 'pending_approval',
                    message: 'Votre compte doit être validé par un administrateur.',
                };
            }

            if (!user.has_accepted_terms_and_conditions && options.acceptedTerms) {
                await user.update({ has_accepted_terms_and_conditions: true }, { transaction });
            }

            if (!user.has_accepted_terms_and_conditions) {
                await transaction.rollback();
                return {
                    status: 'error',
                    code: 'terms_required',
                    message: 'Vous devez accepter les conditions d\'utilisation.',
                };
            }

            // Recharge roles after potential updates
            const userWithRoles = await User.findByPk(user.id, {
                include: [{ model: Role, as: 'roles' }],
                transaction,
            });
            if (!userWithRoles) {
                await transaction.rollback();
                throw new CustomError('Utilisateur introuvable après authentification Discord', 500);
            }

            const token = await User.generateToken(userWithRoles as User & { roles?: Role[] });
            const roles = ((userWithRoles as User & { roles?: Role[] }).roles || []).map((role) => role.label);

            await transaction.commit();
            return {
                status: 'authenticated',
                token,
                user: {
                    id: userWithRoles.id,
                    email: userWithRoles.email || '',
                    username: userWithRoles.username,
                    roles,
                },
            };
        } catch (error) {
            try {
                await transaction.rollback();
            } catch {
                // ignore
            }
            throw error;
        }
    }

    static async handleOAuthCallback(
        code: string,
        options: { locale?: string; acceptedTerms?: boolean } = {}
    ): Promise<DiscordAuthResult> {
        const tokenResponse = await DiscordAuthService.exchangeCode(code);
        const discordUser = await DiscordAuthService.fetchDiscordUser(tokenResponse.access_token);

        const isMember = await DiscordAuthService.isMemberOfRequiredGuild(
            tokenResponse.access_token,
            discordUser.id
        );
        if (!isMember) {
            return {
                status: 'error',
                code: 'not_in_guild',
                message: 'Vous devez être membre du serveur Discord Archetype Warfare pour vous connecter.',
            };
        }

        return DiscordAuthService.loginOrRegisterFromDiscord(discordUser, options);
    }
}

export default DiscordAuthService;
