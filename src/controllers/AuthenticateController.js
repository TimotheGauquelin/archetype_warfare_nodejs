import axios from "axios";
import Role from "../models/RoleModel.js";
import User from "../models/UserModel.js";
import sequelize from "../config/Sequelize.js";
import { CustomError } from "../errors/CustomError.js";
import { sendPasswordResetEmail } from "../mailing/sendPasswordResetMail.js";
import AuthenticateService from "../services/AuthenticateService.js";
import { generateRandomToken } from "../utils/token.js";

class AuthenticateController {
    async login(request, result, next) {
        try {
            const { email, password } = request.body;

            if (!email || !password) {
                throw new CustomError("Votre devez écrire un email et un mot de passe", 400);
            }

            const user = await User.findOne({
                where: { email },
                include: [{
                    model: Role,
                    as: 'roles'
                }]
            });

            if (!user) {
                throw new CustomError("Votre email ou votre mot de passe ne correspondent pas", 400);
            }

            // const isValidPassword = await User.validPassword(password, user.password, next)

            // if (!isValidPassword) {
            //     throw new CustomError("Votre email ou votre mot de passe ne correspondent pas", 400);
            // }

            if (!user.is_active) {
                throw new CustomError("Votre compte doit être validé par un administrateur", 400);
            }

            const token = await User.generateToken(user, next)

            return result.status(200).json({
                success: true,
                message: "Connexion réussie !",
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    roles: user.roles ? user.roles.map(role => role.label) : []
                }
            })

        } catch (error) {
            console.log("error", error);
            next(error)
        }
    }

    async discordLogin(req, res, next) {
        try {
            const url = `https://discord.com/oauth2/authorize?client_id=1285141964190384128&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fauthenticate%2Fdiscord%2Fcallback&scope=identify+guilds+guilds.join+guilds.channels.read+guilds.members.read+gdm.join+email`;

            res.json({ url: url });

        } catch (error) {
            console.log("Error in discordLogin:", error);
            next(error);
        }
    }

    async discordCallback(req, res, next) {
        try {
            console.log("Received callback");
            console.log("Query:", req.query);

            if (!req.query.code) {
                throw new CustomError('Discord authorization code missing', 400);
            }

            const { code } = req.query;

            const params = new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI
            });

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'application/x-www-form-urlencoded'
            };

            const response = await axios.post(
                'https://discord.com/api/oauth2/token',
                params,
                {
                    headers
                }
            )

            console.log("response token", response)

            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${response.data.access_token}`,
                    ...headers
                }
            });

            console.log("user response", userResponse);
            const { id, username, email } = userResponse.data;

            const user = await User.findOne({
                where: { email },
                include: [{
                    model: Role,
                    as: 'roles'
                }]
            });

            console.log(user);

            if (!user) {
                const t = await sequelize.transaction();

                const newUser = await User.create({
                    username: username,
                    email: email,
                    is_active: false
                }, { transaction: t });

                // Ajouter le rôle par défaut (2) à l'utilisateur
                await newUser.addRoles([2], { transaction: t });

                await t.commit();

                console.log("===========================================================ici");

                const inviteResponse = await axios.get(
                    `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/invites`, {
                    max_age: 86400,  // The invite will expire in 24 hours
                    max_uses: 1,     // The invite can only be used once
                    target_user_id: id,  // User to invite
                },
                    {
                        headers: {
                            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,  // Bot token
                        },
                    })

                console.log(inviteResponse);

                res.redirect(`${process.env.FRONT_BASEURL}`);
            } else {
                const token = await User.generateToken(user, next)
                res.redirect(`${process.env.FRONT_BASEURL}/login/discord/callback?token=${token}`);
            }

        } catch (error) {
            console.log("Error in discordCallback:", error);
            next(error);
        }
    }

    async requestNewPassword(request, result, next) {
        try {
            const { email } = request.body;

            if (!email) {
                throw new CustomError("Un email est requis.", 400);
            }

            const user = await User.findOne({
                where: { email },
            });

            if (!user) {
                throw new CustomError("Aucun utilisateur n'a été trouvé avec cet email.", 404);
            }


            const resetToken = await generateRandomToken();

            const resetLink = `${process.env.FRONT_BASEURL}/password-reset/${resetToken}`;
            console.log("aaaa");
            await sendPasswordResetEmail(user, resetToken, resetLink, next);

            return result.status(200).json({
                success: true,
                message: "Un email de réinitialisation a été envoyé."
            });

        } catch (error) {
            next(error);
        }
    }

    async updatePassword(request, response, next) {
        const { userId } = request.params
        const { password, confirmationPassword } = request.body
        try {
            if (!password || !confirmationPassword) {
                throw new CustomError("Le mot de passe et la confirmation du mot de passe sont requis.", 400);
            }

            if (password !== confirmationPassword) {
                throw new CustomError("Les mots de passe ne correspondent pas.", 400);
            }

            const user = await User.findByPk(userId);

            if (!user) {
                throw new CustomError("L'utilisateur n'a pas été trouvé.", 404);
            }

            await AuthenticateService.updatePassword(user, password, next);

            return response.status(200).json({
                success: true,
                message: "Le mot de passe a été mis à jour avec succès."
            });

        } catch (error) {
            next(error)
        }
    }
}

export default new AuthenticateController();