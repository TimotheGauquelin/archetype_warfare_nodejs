import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface BanlistReasonAttributes {
    id: number;
    slug: string;
    label: string;
    text: string;
    logo_url: string | null;
    created_at?: Date;
    updated_at?: Date;
}

interface BanlistReasonCreationAttributes
    extends Optional<BanlistReasonAttributes, 'id' | 'logo_url' | 'created_at' | 'updated_at'> {}

class BanlistReason
    extends Model<BanlistReasonAttributes, BanlistReasonCreationAttributes>
    implements BanlistReasonAttributes
{
    declare id: number;
    declare slug: string;
    declare label: string;
    declare text: string;
    declare logo_url: string | null;
    declare created_at?: Date;
    declare updated_at?: Date;
}

BanlistReason.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        slug: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
        },
        label: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        logo_url: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        modelName: 'BanlistReason',
        tableName: 'banlist_reason',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default BanlistReason;
