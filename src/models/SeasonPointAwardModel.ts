import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type SeasonPointSourceType = 'tournament' | 'quiz' | 'manual';

interface SeasonPointAwardAttributes {
    id: number;
    season_id: number;
    user_id: string;
    source_type: SeasonPointSourceType;
    source_id: string | null;
    points: number;
    reason: string;
    meta: Record<string, unknown> | null;
    created_at?: Date;
    updated_at?: Date;
}

type SeasonPointAwardCreationAttributes = Optional<
    SeasonPointAwardAttributes,
    'id' | 'source_id' | 'meta' | 'created_at' | 'updated_at'
>;

class SeasonPointAward
    extends Model<SeasonPointAwardAttributes, SeasonPointAwardCreationAttributes>
    implements SeasonPointAwardAttributes
{
    declare id: number;
    declare season_id: number;
    declare user_id: string;
    declare source_type: SeasonPointSourceType;
    declare source_id: string | null;
    declare points: number;
    declare reason: string;
    declare meta: Record<string, unknown> | null;
    declare created_at?: Date;
    declare updated_at?: Date;
}

SeasonPointAward.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        season_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        source_type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        source_id: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reason: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'SeasonPointAward',
        tableName: 'season_point_award',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default SeasonPointAward;
