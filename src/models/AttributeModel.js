import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';

/**
 * Attribute model representing a card attribute
 * @class Attribute
 * @extends {Model}
 */
class Attribute extends Model {}

Attribute.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    label: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    }
}, {
    sequelize,
    modelName: 'Attribute',
    tableName: 'attribute',
    timestamps: false
});

export default Attribute; 