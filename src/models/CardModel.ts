import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface CardAttributes {
    id: string;
    name: string;
    description?: string | null;
    img_url?: string | null;
    level: number;
    atk: number;
    def: number;
    attribute?: string | null;
    card_type?: string | null;
}

interface CardCreationAttributes extends Optional<CardAttributes, 'description' | 'img_url' | 'level' | 'atk' | 'def' | 'attribute' | 'card_type'> {}

/**
 * Card model representing game cards
 */
class Card extends Model<CardAttributes, CardCreationAttributes> implements CardAttributes {
    declare id: string;
    declare name: string;
    declare description?: string | null;
    declare img_url?: string | null;
    declare level: number;
    declare atk: number;
    declare def: number;
    declare attribute?: string | null;
    declare card_type?: string | null;
}

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
            allowNull: true
        },
        img_url: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        atk: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        def: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        attribute: {
            type: DataTypes.STRING(15),
            allowNull: true
        },
        card_type: {
            type: DataTypes.STRING(50),
            allowNull: true
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
