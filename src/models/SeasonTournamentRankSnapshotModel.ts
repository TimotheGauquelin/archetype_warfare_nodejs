import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';
import type { SeasonTournamentTier } from '../utils/seasonTournamentRank';

interface SeasonTournamentRankSnapshotAttributes {
    id: number;
    season_id: number;
    user_id: string;
    tier: SeasonTournamentTier;
    points: number;
    leaderboard_rank: number;
    tournaments_count: number;
    created_at?: Date;
}

type Creation = Optional<
    SeasonTournamentRankSnapshotAttributes,
    'id' | 'tournaments_count' | 'created_at'
>;

class SeasonTournamentRankSnapshot
    extends Model<SeasonTournamentRankSnapshotAttributes, Creation>
    implements SeasonTournamentRankSnapshotAttributes
{
    declare id: number;
    declare season_id: number;
    declare user_id: string;
    declare tier: SeasonTournamentTier;
    declare points: number;
    declare leaderboard_rank: number;
    declare tournaments_count: number;
    declare created_at?: Date;
}

SeasonTournamentRankSnapshot.init(
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
        tier: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        leaderboard_rank: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tournaments_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'SeasonTournamentRankSnapshot',
        tableName: 'season_tournament_rank_snapshot',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    }
);

export default SeasonTournamentRankSnapshot;
