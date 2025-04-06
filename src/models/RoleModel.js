import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * Role model representing a user role
 * @class Role
 * @extends {Model}
 */
class Role extends Model {}

Role.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    label: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    // description: {
    //     type: DataTypes.TEXT,
    //     allowNull: false
    // }
}, {
    sequelize,
    modelName: 'Role',
    tableName: 'role',
    timestamps: false
});

export default Role; 