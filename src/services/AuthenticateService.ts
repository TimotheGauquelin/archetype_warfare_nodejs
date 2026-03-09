import { ValidationError } from 'sequelize';
import { User, Role } from '../models/relations';
import sequelize from '../config/Sequelize';
import { CustomError } from '../errors/CustomError';
import { sendWaitingApprovalEmail } from '../mailing/sendWaitingApprovalMail';
import { sendAccountApprovedEmail } from '../mailing/sendAccountApprovedMail';
import logger from '../utils/logger';

interface UserData {
    username?: string;
    email: string;
    password: string;
    hasAcceptedTermsAndConditions?: boolean;
}

interface RegisterResult {
    success: boolean;
    message: string;
    user: {
        id: string;
        email: string;
        is_active: boolean;
    };
}

interface ApproveResult {
    success: boolean;
    message: string;
    user: {
        id: string;
        email: string;
        is_active: boolean;
        roles: string[];
    };
}

class AuthenticateService {
    static async register(userData: UserData): Promise<RegisterResult> {
        const transaction = await sequelize.transaction();

        try {

            const user = await User.create({
                username: userData.username?.trim(),
                email: userData.email.trim(),
                password: userData.password,
                is_active: false,
                is_banned: false,
                has_accepted_terms_and_conditions: userData.hasAcceptedTermsAndConditions ?? false
            }, { transaction });

            await sendWaitingApprovalEmail({
                id: user.id,
                email: user.email || '',
                username: user.username || undefined
            });

            await transaction.commit();

            return {
                success: true,
                message: 'Inscription réussie ! Votre compte doit être approuvé par un administrateur. Un email de confirmation vous a été envoyé.',
                user: {
                    id: user.id,
                    email: user.email || '',
                    is_active: user.is_active
                }
            };
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch {
                    // Transaction déjà terminée, ignorer
                }
            }
            if (error instanceof ValidationError && error.errors?.length) {
                const hasEmailViolation = error.errors.some(e => e.type === 'unique violation' && e.path === 'email');
                const hasUsernameViolation = error.errors.some(e => e.type === 'unique violation' && e.path === 'username');
                let msg: string;
                if (hasEmailViolation) {
                    msg = 'Un utilisateur avec cet email existe déjà.';
                }
                else if (hasUsernameViolation) {
                    msg = 'Ce nom d\'utilisateur est déjà utilisé.';
                }
                else {
                    const first = error.errors[0];
                    msg = first.type === 'unique violation'
                        ? (first.path === 'email' ? 'Un utilisateur avec cet email existe déjà.' : 'Ce nom d\'utilisateur est déjà utilisé.')
                        : (first.message || 'Données invalides.');
                }
                throw new CustomError(msg, 400);
            }
            throw error;
        }
    }

    static async adminApproveUser(userId: string, roleLabels: string[] = []): Promise<ApproveResult> {
        const transaction = await sequelize.transaction();

        try {
            const user = await User.findByPk(userId, { transaction });
            if (!user) {
                throw new CustomError('User not found', 404);
            }

            if (user.is_active) {
                throw new CustomError('Cet utilisateur a déjà été approuvé', 400);
            }

            await user.update({ is_active: true }, { transaction });

            await (user as any).setRoles([], { transaction });

            if (roleLabels && roleLabels.length > 0) {
                const roles = await Role.findAll({
                    where: { label: roleLabels },
                    transaction
                });

                if (roles.length > 0) {
                    await (user as any).addRoles(roles, { transaction });
                }
            }

            await transaction.commit();

            try {
                await sendAccountApprovedEmail({
                    id: user.id,
                    email: user.email || '',
                    username: user.username || undefined
                }, roleLabels);
            } catch (emailError) {
                logger.logError('Erreur lors de l\'envoi de l\'email de confirmation', emailError instanceof Error ? emailError : null);
            }

            return {
                success: true,
                message: 'Utilisateur approuvé avec succès. Un email de confirmation a été envoyé.',
                user: {
                    id: user.id,
                    email: user.email || '',
                    is_active: user.is_active,
                    roles: roleLabels
                }
            };
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch {

                }
            }
            throw error;
        }
    }

    static async updatePassword(user: User, password: string): Promise<User> {
        user.password = password;
        user.reset_password_token = null;

        await user.save();

        return user;
    }
}

export default AuthenticateService;
