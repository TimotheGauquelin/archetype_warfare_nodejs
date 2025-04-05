import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';

/**
 * Card model representing game cards
 * @class Card
 * @extends {Model}
 */
class Card extends Model {}

Card.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        img_url: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        atk: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        def: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        attribute: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        card_type: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'Card',
        tableName: 'card',
        timestamps: false,
    }
);

export default Card; 