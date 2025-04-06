import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';
import bcrypt from 'bcryptjs';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
/**
 * User model representing application users
 * @class User
 * @extends {Model}
 */
class User extends Model {

    static async validPassword(user, password, next) {
        try {
            return bcrypt.compare(password, user.password);
        } catch (error) {
            next(error)
        }
    }

    static async generateToken(user, next) {
        try {
            const { id, email, lastname, roles } = user;

            const roleLabels = roles.map(role => role.label);

            const payload = {
                id,
                email,
                lastname,
                roles: roleLabels
            };

            return sign(payload, process.env.DATABASE_SECRET, { expiresIn: '2h' });

        } catch (error) {
            next(error)
        }
    }

    static async validateToken(token, next) {
        try {
            return pkg.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            next(error)
        }
    }
}

User.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        validate: {
            len: {
                args: [3, 30],
                msg: 'Username must be between 3 and 30 characters'
            }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reset_password_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    is_banned: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeUpdate: async (user, options) => {
            // Si le mot de passe est modifié, on le hache avant de l'enregistrer
            console.log("userr", user);
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

export default User; 