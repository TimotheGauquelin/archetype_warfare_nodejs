import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface RoleAttributes {
    id: number;
    label: string;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id'> {}

/**
 * Role model representing a user role
 */
class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    declare id: number;
    declare label: string;
}

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
    }
}, {
    sequelize,
    modelName: 'Role',
    tableName: 'role',
    timestamps: false
});

export default Role;
