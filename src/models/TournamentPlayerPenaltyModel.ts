import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface TournamentPlayerPenaltyAttributes {
    id: number;
    tournament_player_id: number;
    penalty_type_id: number;
    round_id: number | null;
    tournament_match_id: number | null;
    applied_at: Date;
    applied_by_user_id: number | null;
    reason: string | null;
    notes: string | null;
    disqualification_with_prize: boolean | null;
    written_statement_sent_at: Date | null;
}

interface TournamentPlayerPenaltyCreationAttributes extends Optional<
    TournamentPlayerPenaltyAttributes,
    'id' | 'round_id' | 'tournament_match_id' | 'applied_at' | 'applied_by_user_id' | 'reason' | 'notes' | 'disqualification_with_prize' | 'written_statement_sent_at'
> {}

class TournamentPlayerPenalty extends Model<TournamentPlayerPenaltyAttributes, TournamentPlayerPenaltyCreationAttributes> implements TournamentPlayerPenaltyAttributes {
    declare id: number;
    declare tournament_player_id: number;
    declare penalty_type_id: number;
    declare round_id: number | null;
    declare tournament_match_id: number | null;
    declare applied_at: Date;
    declare applied_by_user_id: number | null;
    declare reason: string | null;
    declare notes: string | null;
    declare disqualification_with_prize: boolean | null;
    declare written_statement_sent_at: Date | null;
}

TournamentPlayerPenalty.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tournament_player_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tournament_player', key: 'id' }
    },
    penalty_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'penalty_type', key: 'id' }
    },
    round_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'tournament_round', key: 'id' }
    },
    tournament_match_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'tournament_match', key: 'id' }
    },
    applied_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    applied_by_user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: 'user', key: 'id' }
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    disqualification_with_prize: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    written_statement_sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'TournamentPlayerPenalty',
    tableName: 'tournament_player_penalty',
    timestamps: false
});

export default TournamentPlayerPenalty;
