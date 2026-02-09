import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface CardStatusAttributes {
    id: number;
    label: string;
    limit: number | null;
}

interface CardStatusCreationAttributes extends Optional<CardStatusAttributes, 'id' | 'limit'> {}

/**
 * CardStatus model representing the status of a banlist archetype card
 */
class CardStatus extends Model<CardStatusAttributes, CardStatusCreationAttributes> implements CardStatusAttributes {
    declare id: number;
    declare label: string;
    declare limit: number | null;
}

CardStatus.init(
    {
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
        limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: true
        }
    },
    {
        sequelize,
        modelName: 'CardStatus',
        tableName: 'card_status',
        timestamps: false,
    }
);

export default CardStatus;
