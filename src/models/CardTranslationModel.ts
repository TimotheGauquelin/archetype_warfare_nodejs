import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface CardTranslationAttributes {
    card_id: string;
    locale: string;
    name: string;
    description?: string | null;
}

interface CardTranslationCreationAttributes
    extends Optional<CardTranslationAttributes, 'description'> {}

/**
 * Traductions d'une carte (une ligne par locale).
 */
class CardTranslation
    extends Model<CardTranslationAttributes, CardTranslationCreationAttributes>
    implements CardTranslationAttributes
{
    declare card_id: string;
    declare locale: string;
    declare name: string;
    declare description?: string | null;
}

CardTranslation.init(
    {
        card_id: {
            type: DataTypes.STRING(8),
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'card',
                key: 'id',
            },
        },
        locale: {
            type: DataTypes.STRING(5),
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'CardTranslation',
        tableName: 'card_translation',
        timestamps: false,
    }
);

export default CardTranslation;
