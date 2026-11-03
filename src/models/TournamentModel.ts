import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type TournamentStatus =
    | 'not_visible'
    | 'registration_open'
    | 'registration_closed'
    | 'tournament_beginning'
    | 'tournament_in_progress'
    | 'tournament_finished'
    | 'tournament_cancelled'
    | 'tournament_did_not_happen';

export type MatchResolutionMode = 'strict_wins' | 'highest_score';

const TOURNAMENT_STATUSES: TournamentStatus[] = [
    'not_visible',
    'registration_open',
    'registration_closed',
    'tournament_beginning',
    'tournament_in_progress',
    'tournament_finished',
    'tournament_cancelled',
    'tournament_did_not_happen',
];

const MATCH_RESOLUTION_MODES: MatchResolutionMode[] = ['strict_wins', 'highest_score'];

interface TournamentAttributes {
    id: string;
    name: string;
    max_number_of_rounds: number;
    matches_per_round: number;
    match_resolution_mode: MatchResolutionMode;
    status: TournamentStatus;
    current_round: number;
    until_winner: boolean;
    require_deck_list: boolean;
    is_official: boolean;
    allow_penalities: boolean;
    max_players: number | null;
    location: string | null;
    event_date: Date | null;
    event_date_end: Date | null;
    is_online: boolean;
    registration_close_hours_before: number;
    image_url: string | null;
    image_focal_x: number;
    image_focal_y: number;
    image_zoom: number;
    created_at?: Date;
    updated_at?: Date;
}

interface TournamentCreationAttributes
    extends Optional<
        TournamentAttributes,
        | 'id'
        | 'status'
        | 'current_round'
        | 'match_resolution_mode'
        | 'until_winner'
        | 'require_deck_list'
        | 'is_official'
        | 'allow_penalities'
        | 'max_players'
        | 'location'
        | 'event_date'
        | 'event_date_end'
        | 'is_online'
        | 'registration_close_hours_before'
        | 'image_url'
        | 'image_focal_x'
        | 'image_focal_y'
        | 'image_zoom'
        | 'created_at'
        | 'updated_at'
    > {}

class Tournament extends Model<TournamentAttributes, TournamentCreationAttributes> implements TournamentAttributes {
    declare id: string;
    declare name: string;
    declare max_number_of_rounds: number;
    declare matches_per_round: number;
    declare match_resolution_mode: MatchResolutionMode;
    declare status: TournamentStatus;
    declare current_round: number;
    declare until_winner: boolean;
    declare require_deck_list: boolean;
    declare is_official: boolean;
    declare allow_penalities: boolean;
    declare max_players: number | null;
    declare location: string | null;
    declare event_date: Date | null;
    declare event_date_end: Date | null;
    declare is_online: boolean;
    declare registration_close_hours_before: number;
    declare image_url: string | null;
    declare image_focal_x: number;
    declare image_focal_y: number;
    declare image_zoom: number;
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
        match_resolution_mode: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'strict_wins',
            validate: { isIn: [MATCH_RESOLUTION_MODES] }
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'not_visible',
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
        is_official: {
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
        registration_close_hours_before: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 48,
        },
        image_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image_focal_x: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 50,
        },
        image_focal_y: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 50,
        },
        image_zoom: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 100,
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
