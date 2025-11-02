import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * CardStatus model representing the status of a banlist archetype card
 * @class CardStatus
 * @extends {Model}
 */
class CardStatus extends Model { }

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