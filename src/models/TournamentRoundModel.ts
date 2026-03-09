import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type RoundStatus = 'pending' | 'in_progress' | 'completed';

interface TournamentRoundAttributes {
    id: number;
    tournament_id: string;
    round_number: number;
    status: RoundStatus;
    created_at?: Date;
    updated_at?: Date;
}

interface TournamentRoundCreationAttributes extends Optional<TournamentRoundAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

class TournamentRound extends Model<TournamentRoundAttributes, TournamentRoundCreationAttributes> implements TournamentRoundAttributes {
    declare id: number;
    declare tournament_id: string;
    declare round_number: number;
    declare status: RoundStatus;
    declare created_at?: Date;
    declare updated_at?: Date;
}

TournamentRound.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tournament_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'tournament', key: 'id' }
    },
    round_number: {
        type: DataTypes.INTEGER,
        allowNull: false
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
    modelName: 'TournamentRound',
    tableName: 'tournament_round',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default TournamentRound;
