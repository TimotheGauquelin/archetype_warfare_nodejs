import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface DeckAttributes {
    id: number;
    label: string;
    comment: string;
    archetype_id: number | null;
    user_id: number | null;
    created_at?: Date;
    updated_at?: Date;
}

interface DeckCreationAttributes extends Optional<DeckAttributes, 'id' | 'archetype_id' | 'user_id' | 'created_at' | 'updated_at'> {}

/**
 * Deck model representing user cards deck
 */
class Deck extends Model<DeckAttributes, DeckCreationAttributes> implements DeckAttributes {
    declare id: number;
    declare label: string;
    declare comment: string;
    declare archetype_id: number | null;
    declare user_id: number | null;
    declare created_at?: Date;
    declare updated_at?: Date;
}

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
