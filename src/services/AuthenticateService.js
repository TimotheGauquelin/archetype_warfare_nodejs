import { User, Role } from '../models/relations.js';
import sequelize from '../config/Sequelize.js';
import { CustomError } from '../errors/CustomError.js';
import { sendWaitingApprovalEmail } from '../mailing/sendWaitingApprovalMail.js';
import { sendAccountApprovedEmail } from '../mailing/sendAccountApprovedMail.js';

class AuthenticateService {
    static async register(userData) {
        const transaction = await sequelize.transaction();

        try {
            const existingUser = await User.findOne({ where: { email: userData.email } });
            if (existingUser) {
                await transaction.rollback();
                throw new CustomError('User with this email already exists', 400);
            }

            const user = await User.create({
                ...userData,
                is_active: false
            }, { transaction });

            await sendWaitingApprovalEmail(user);

            await transaction.commit();

            return {
                success: true,
                message: 'Inscription réussie ! Votre compte doit être approuvé par un administrateur. Un email de confirmation vous a été envoyé.',
                user: {
                    id: user.id,
                    email: user.email,
                    is_active: user.is_active
                }
            };
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    static async adminApproveUser(userId, roleLabels) {
        const transaction = await sequelize.transaction();

        try {
            const user = await User.findByPk(userId, { transaction });
            if (!user) {
                await transaction.rollback();
                throw new CustomError('User not found', 404);
            }

            // Vérifier si l'utilisateur est déjà approuvé
            if (user.is_active) {
                await transaction.rollback();
                throw new CustomError('Cet utilisateur a déjà été approuvé', 400);
            }

            // Activer l'utilisateur
            await user.update({ is_active: true }, { transaction });

            await user.setRoles([], { transaction });

            if (roleLabels && roleLabels.length > 0) {
                const roles = await Role.findAll({
                    where: { label: roleLabels },
                    transaction
                });

                if (roles.length > 0) {
                    await user.addRoles(roles, { transaction });
                }
            }

            await transaction.commit();

            // Envoyer l'email de confirmation d'approbation
            try {
                await sendAccountApprovedEmail(user, roleLabels);
            } catch (emailError) {
                console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
                // On ne fait pas échouer l'approbation si l'email échoue
            }

            return {
                success: true,
                message: 'Utilisateur approuvé avec succès. Un email de confirmation a été envoyé.',
                user: {
                    id: user.id,
                    email: user.email,
                    is_active: user.is_active,
                    roles: roleLabels
                }
            };
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    static async updatePassword(user, password, next) {
        try {
            user.password = password;
            user.reset_password_token = null;

            await user.save();

            return user;
        } catch (error) {
            next(error);
        }
    }
}

export default AuthenticateService;
