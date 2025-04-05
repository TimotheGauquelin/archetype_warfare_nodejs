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
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Type',
    tableName: 'type',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Type; 