import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface TypeAttributes {
    id: number;
    label: string;
}

interface TypeCreationAttributes extends Optional<TypeAttributes, 'id'> {}

/**
 * Type model representing a card type
 */
class Type extends Model<TypeAttributes, TypeCreationAttributes> implements TypeAttributes {
    declare id: number;
    declare label: string;
}

Type.init({
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
    modelName: 'Type',
    tableName: 'type',
    timestamps: false
});

export default Type;
