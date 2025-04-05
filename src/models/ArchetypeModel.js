import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';

/**
 * Archetype model representing a group of card
 * @class Archetype
 * @extends {Model}
 */
class Archetype extends Model {}

Archetype.init({
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
    era_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'era',
            key: 'id'
        }
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
    modelName: 'Archetype',
    tableName: 'archetype',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Archetype; 