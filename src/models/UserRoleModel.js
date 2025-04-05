import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

class UserRole extends Model {}

UserRole.init({
    user_id: {
        type: DataTypes.INTEGER,
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