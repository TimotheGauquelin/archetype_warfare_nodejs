import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface BanlistArchetypeCardAttributes {
    id: number;
    banlist_id: number | null;
    archetype_id: number | null;
    card_id: string | null;
    explanation_text: string | null;
    card_status_id: number | null;
    created_at?: Date;
    updated_at?: Date;
}

interface BanlistArchetypeCardCreationAttributes extends Optional<BanlistArchetypeCardAttributes, 'id' | 'banlist_id' | 'archetype_id' | 'card_id' | 'explanation_text' | 'card_status_id' | 'created_at' | 'updated_at'> {}

/**
 * BanlistArchetypeCard model representing an instance of archetype card inside the banlist
 */
class BanlistArchetypeCard extends Model<BanlistArchetypeCardAttributes, BanlistArchetypeCardCreationAttributes> implements BanlistArchetypeCardAttributes {
    declare id: number;
    declare banlist_id: number | null;
    declare archetype_id: number | null;
    declare card_id: string | null;
    declare explanation_text: string | null;
    declare card_status_id: number | null;
    declare created_at?: Date;
    declare updated_at?: Date;
}

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
