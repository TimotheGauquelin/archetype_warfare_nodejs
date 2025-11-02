import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * Deck model representing user cards deck
 * @class Deck
 * @extends {Model}
 */
class Deck extends Model { }

Deck.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    archetype_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'archetype',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'user',
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Deck',
    tableName: 'deck',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default Deck; 