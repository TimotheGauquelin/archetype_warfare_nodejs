import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface BanlistArchetypeCardReasonAttributes {
    id: number;
    banlist_archetype_card_id: number;
    banlist_reason_id: number;
    position: number;
    created_at?: Date;
    updated_at?: Date;
}

interface BanlistArchetypeCardReasonCreationAttributes
    extends Optional<
        BanlistArchetypeCardReasonAttributes,
        'id' | 'position' | 'created_at' | 'updated_at'
    > {}

class BanlistArchetypeCardReason
    extends Model<BanlistArchetypeCardReasonAttributes, BanlistArchetypeCardReasonCreationAttributes>
    implements BanlistArchetypeCardReasonAttributes
{
    declare id: number;
    declare banlist_archetype_card_id: number;
    declare banlist_reason_id: number;
    declare position: number;
    declare created_at?: Date;
    declare updated_at?: Date;
}

BanlistArchetypeCardReason.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        banlist_archetype_card_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'banlist_archetype_card',
                key: 'id',
            },
        },
        banlist_reason_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'banlist_reason',
                key: 'id',
            },
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'BanlistArchetypeCardReason',
        tableName: 'banlist_archetype_card_reason',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default BanlistArchetypeCardReason;
