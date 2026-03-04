import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface TournamentPlayerAttributes {
    id: number;
    tournament_id: number;
    user_id: number;
    deck_id: number | null;
    match_wins: number;
    match_losses: number;
    match_draws: number;
    games_won: number;
    games_played: number;
    dropped: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface TournamentPlayerCreationAttributes extends Optional<TournamentPlayerAttributes, 'id' | 'deck_id' | 'match_wins' | 'match_losses' | 'match_draws' | 'games_won' | 'games_played' | 'dropped' | 'created_at' | 'updated_at'> {}

class TournamentPlayer extends Model<TournamentPlayerAttributes, TournamentPlayerCreationAttributes> implements TournamentPlayerAttributes {
    declare id: number;
    declare tournament_id: number;
    declare user_id: number;
    declare deck_id: number | null;
    declare match_wins: number;
    declare match_losses: number;
    declare match_draws: number;
    declare games_won: number;
    declare games_played: number;
    declare dropped: boolean;
    declare created_at?: Date;
    declare updated_at?: Date;
}

TournamentPlayer.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tournament_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tournament', key: 'id' }
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'user', key: 'id' }
    },
    deck_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'deck', key: 'id' }
    },
    match_wins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    match_losses: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    match_draws: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    games_won: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    games_played: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    dropped: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    modelName: 'TournamentPlayer',
    tableName: 'tournament_player',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default TournamentPlayer;
