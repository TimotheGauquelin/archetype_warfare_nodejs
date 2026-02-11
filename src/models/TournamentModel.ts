import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type TournamentStatus =
    | 'registration_open'
    | 'registration_closed'
    | 'tournament_beginning'
    | 'tournament_in_progress'
    | 'tournament_finished'
    | 'tournament_cancelled';

const TOURNAMENT_STATUSES: TournamentStatus[] = [
    'registration_open',
    'registration_closed',
    'tournament_beginning',
    'tournament_in_progress',
    'tournament_finished',
    'tournament_cancelled'
];

interface TournamentAttributes {
    id: number;
    name: string;
    number_of_rounds: number;
    matches_per_round: number;
    status: TournamentStatus;
    current_round: number;
    max_players: number | null;
    location: string | null;
    event_date: Date | null;
    event_date_end: Date | null;
    is_online: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface TournamentCreationAttributes
    extends Optional<
        TournamentAttributes,
        'id' | 'status' | 'current_round' | 'max_players' | 'location' | 'event_date' | 'event_date_end' | 'is_online' | 'created_at' | 'updated_at'
    > {}

class Tournament extends Model<TournamentAttributes, TournamentCreationAttributes> implements TournamentAttributes {
    declare id: number;
    declare name: string;
    declare number_of_rounds: number;
    declare matches_per_round: number;
    declare status: TournamentStatus;
    declare current_round: number;
    declare max_players: number | null;
    declare location: string | null;
    declare event_date: Date | null;
    declare event_date_end: Date | null;
    declare is_online: boolean;
    declare created_at?: Date;
    declare updated_at?: Date;
}

Tournament.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        number_of_rounds: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        matches_per_round: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { isIn: [[1, 3, 5]] }
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'registration_closed',
            validate: { isIn: [TOURNAMENT_STATUSES] }
        },
        current_round: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        max_players: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        event_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        event_date_end: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_online: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: 'Tournament',
        tableName: 'tournament',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Tournament;
