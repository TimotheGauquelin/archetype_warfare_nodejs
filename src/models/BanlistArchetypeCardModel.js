import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';

/**
 * BanlistArchetypeCard model representing an instance of archetype card inside the banlist
 * @class BanlistArchetypeCard
 * @extends {Model}
 */
class BanlistArchetypeCard extends Model {}

BanlistArchetypeCard.init(
    {
        banlist_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'banlist',
                key: 'id'
            }
        },
        archetype_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'archetype',
                key: 'id'
            }
        },
        card_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'card',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('forbidden', 'limited', 'semi_limited', 'unlimited'),
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
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