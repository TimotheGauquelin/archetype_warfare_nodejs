import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface CardTypeAttributes {
    id: number;
    label: string;
    description: string;
    num_order?: number;
}

interface CardTypeCreationAttributes extends Optional<CardTypeAttributes, 'id' | 'num_order'> {}

/**
 * CardType model representing a game card type
 */
class CardType extends Model<CardTypeAttributes, CardTypeCreationAttributes> implements CardTypeAttributes {
    declare id: number;
    declare label: string;
    declare description: string;
    declare num_order?: number;
}

CardType.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    label: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    num_order: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'CardType',
    tableName: 'card_type',
    timestamps: false
});

export default CardType;
