import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CustomError } from '../errors/CustomError';
import envVars from '../config/envValidation';

interface Role {
    id: number;
    label: string;
}

interface UserAttributes {
    id: number;
    username: string | null;
    password: string | null;
    reset_password_token: string | null;
    email: string | null;
    is_active: boolean;
    is_banned: boolean;
    has_accepted_terms_and_conditions: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'username' | 'password' | 'reset_password_token' | 'email' | 'created_at' | 'updated_at'> {}

interface UserWithRoles extends UserAttributes {
    roles?: Role[];
}

/**
 * User model representing application users
 */
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare id: number;
    declare username: string | null;
    declare password: string | null;
    declare reset_password_token: string | null;
    declare email: string | null;
    declare is_active: boolean;
    declare is_banned: boolean;
    declare has_accepted_terms_and_conditions: boolean;
    declare created_at?: Date;
    declare updated_at?: Date;

    static async validPassword(userPassword: string, password: string): Promise<boolean> {
        return await bcrypt.compare(password, userPassword);
    }

    static async emailAlreadyUsed(email: string): Promise<boolean> {
        const user = await User.findOne({
            where: {
                email: email
            }
        });

        if (user) {
            throw new CustomError('Email already used', 400);
        }

        return false;
    }

    static async generateToken(user: UserWithRoles): Promise<string> {
        const { id, email, username, roles } = user;

        const roleLabels = roles ? roles.map(role => role.label) : [];

        const payload = {
            id,
            email,
            username,
            roles: roleLabels
        };

        return jwt.sign(payload, envVars.JWT_SECRET, { expiresIn: '2h' });
    }

    static async validateToken(token: string): Promise<jwt.JwtPayload | string> {
        return jwt.verify(token, envVars.JWT_SECRET);
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
    has_accepted_terms_and_conditions: {
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
        beforeCreate: async (user: User): Promise<void> => {
            if (user.get('password')) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.get('password') as string, salt);
                user.set('password', hashedPassword);
            }
        },
        beforeUpdate: async (user: User): Promise<void> => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.get('password') as string, salt);
                user.set('password', hashedPassword);
            }
        }
    }
});

export default User;
