import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';

/**
 * DeckCard model representing a card inside deck
 * @class DeckCard
 * @extends {Model}
 */
class DeckCard extends Model {}

DeckCard.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    deck_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'deck',
            key: 'id'
        }
    },
    card_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'card',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 3
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
    modelName: 'DeckCard',
    tableName: 'deck_card',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default DeckCard; 