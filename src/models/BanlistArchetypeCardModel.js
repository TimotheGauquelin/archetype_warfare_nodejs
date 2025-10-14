import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * BanlistArchetypeCard model representing an instance of archetype card inside the banlist
 * @class BanlistArchetypeCard
 * @extends {Model}
 */
class BanlistArchetypeCard extends Model { }

BanlistArchetypeCard.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        banlist_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'banlist',
                key: 'id'
            }
        },
        archetype_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'archetype',
                key: 'id'
            }
        },
        card_id: {
            type: DataTypes.STRING(8),
            allowNull: true,
            references: {
                model: 'card',
                key: 'id'
            }
        },
        explanation_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        card_status_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'card_status',
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
        },
    },
    {
        sequelize,
        modelName: 'BanlistArchetypeCard',
        tableName: 'banlist_archetype_card',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default BanlistArchetypeCard; 