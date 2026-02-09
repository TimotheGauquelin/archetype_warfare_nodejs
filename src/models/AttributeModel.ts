import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface AttributeAttributes {
    id: number;
    label: string;
}

interface AttributeCreationAttributes extends Optional<AttributeAttributes, 'id'> {}

/**
 * Attribute model representing a card attribute
 */
class Attribute extends Model<AttributeAttributes, AttributeCreationAttributes> implements AttributeAttributes {
    declare id: number;
    declare label: string;
}

Attribute.init({
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
    modelName: 'Attribute',
    tableName: 'attribute',
    timestamps: false
});

export default Attribute;
