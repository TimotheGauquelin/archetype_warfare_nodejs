import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type MatchStatus = 'pending' | 'in_progress' | 'completed';

interface TournamentMatchAttributes {
    id: number;
    round_id: number;
    tournament_id: number;
    player1_tournament_player_id: number;
    player2_tournament_player_id: number;
    player1_games_won: number;
    player2_games_won: number;
    winner_tournament_player_id: number | null;
    status: MatchStatus;
    created_at?: Date;
    updated_at?: Date;
}

interface TournamentMatchCreationAttributes extends Optional<TournamentMatchAttributes, 'id' | 'player1_games_won' | 'player2_games_won' | 'winner_tournament_player_id' | 'status' | 'created_at' | 'updated_at'> {}

class TournamentMatch extends Model<TournamentMatchAttributes, TournamentMatchCreationAttributes> implements TournamentMatchAttributes {
    declare id: number;
    declare round_id: number;
    declare tournament_id: number;
    declare player1_tournament_player_id: number;
    declare player2_tournament_player_id: number;
    declare player1_games_won: number;
    declare player2_games_won: number;
    declare winner_tournament_player_id: number | null;
    declare status: MatchStatus;
    declare created_at?: Date;
    declare updated_at?: Date;
}

TournamentMatch.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    round_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tournament_round', key: 'id' }
    },
    tournament_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tournament', key: 'id' }
    },
    player1_tournament_player_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tournament_player', key: 'id' }
    },
    player2_tournament_player_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tournament_player', key: 'id' }
    },
    player1_games_won: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    player2_games_won: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    winner_tournament_player_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'tournament_player', key: 'id' }
    },
    status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pending',
        validate: { isIn: [['pending', 'in_progress', 'completed']] }
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
    }
}, {
    sequelize,
    modelName: 'TournamentMatch',
    tableName: 'tournament_match',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default TournamentMatch;
