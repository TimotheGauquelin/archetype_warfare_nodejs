import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize';

interface UserRoleAttributes {
    user_id: string;
    role_id: number;
}

/**
 * UserRole model representing the many-to-many relationship between User and Role
 */
class UserRole extends Model<UserRoleAttributes, UserRoleAttributes> implements UserRoleAttributes {
    declare user_id: string;
    declare role_id: number;
}

UserRole.init({
    user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'user',
            key: 'id'
        }
    },
    role_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'role',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_role',
    timestamps: false
});

export default UserRole;
