import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface DeckCardAttributes {
    deck_id: string;
    card_id: string;
    quantity: number;
}

interface DeckCardCreationAttributes extends Optional<DeckCardAttributes, never> {}

/**
 * DeckCard model representing a card inside deck
 */
class DeckCard extends Model<DeckCardAttributes, DeckCardCreationAttributes> implements DeckCardAttributes {
    declare deck_id: string;
    declare card_id: string;
    declare quantity: number;
}

DeckCard.init({
    deck_id: {
        type: DataTypes.UUID,
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
    timestamps: false
});

export default DeckCard;
