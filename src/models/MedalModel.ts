import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type MedalCategory =
    | 'deck'
    | 'tournament'
    | 'archetype'
    | 'quiz'
    | 'loyalty';

interface MedalAttributes {
    id: number;
    code: string;
    category: MedalCategory | string;
    title: string;
    description: string;
    icon_url: string | null;
    is_contextual: boolean;
    threshold: number | null;
    sort_order: number;
    created_at?: Date;
    updated_at?: Date;
}

interface MedalCreationAttributes
    extends Optional<
        MedalAttributes,
        | 'id'
        | 'icon_url'
        | 'is_contextual'
        | 'threshold'
        | 'sort_order'
        | 'created_at'
        | 'updated_at'
    > {}

class Medal
    extends Model<MedalAttributes, MedalCreationAttributes>
    implements MedalAttributes
{
    declare id: number;
    declare code: string;
    declare category: MedalCategory | string;
    declare title: string;
    declare description: string;
    declare icon_url: string | null;
    declare is_contextual: boolean;
    declare threshold: number | null;
    declare sort_order: number;
    declare created_at?: Date;
    declare updated_at?: Date;
}

Medal.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        code: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
        },
        category: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(160),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        icon_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_contextual: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        threshold: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sort_order: {
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
        modelName: 'Medal',
        tableName: 'medal',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default Medal;
