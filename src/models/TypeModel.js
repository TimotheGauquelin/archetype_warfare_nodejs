import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';

/**
 * Type model representing a card type
 * @class Type
 * @extends {Model}
 */
class Type extends Model {}

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