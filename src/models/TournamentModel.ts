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
    id: string;
    name: string;
    max_number_of_rounds: number;
    matches_per_round: number;
    status: TournamentStatus;
    current_round: number;
    until_winner: boolean;
    require_deck_list: boolean;
    allow_penalities: boolean;
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
        'id' | 'status' | 'current_round' | 'until_winner' | 'require_deck_list' | 'allow_penalities' | 'max_players' | 'location' | 'event_date' | 'event_date_end' | 'is_online' | 'created_at' | 'updated_at'
    > {}

class Tournament extends Model<TournamentAttributes, TournamentCreationAttributes> implements TournamentAttributes {
    declare id: string;
    declare name: string;
    declare max_number_of_rounds: number;
    declare matches_per_round: number;
    declare status: TournamentStatus;
    declare current_round: number;
    declare until_winner: boolean;
    declare require_deck_list: boolean;
    declare allow_penalities: boolean;
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
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        max_number_of_rounds: {
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
        until_winner: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        require_deck_list: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        allow_penalities: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
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
