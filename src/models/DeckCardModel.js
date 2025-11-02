import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * DeckCard model representing a card inside deck
 * @class DeckCard
 * @extends {Model}
 */
class DeckCard extends Model { }

DeckCard.init({
    deck_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'deck',
            key: 'id'
        }
    },
    card_id: {
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'card',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 3
        }
    },
}, {
    sequelize,
    modelName: 'DeckCard',
    tableName: 'deck_card',
    timestamps: false,
    // createdAt: 'created_at',
    // updatedAt: 'updated_at',
    id: false
});

export default DeckCard;