import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface TournamentPlayerDeckAttributes {
    id: number;
    tournament_player_id: number;
    label: string;
    archetype_id: number | null;
    is_playable: boolean;
    snapshot_by_user_id: number | null;
    created_at?: Date;
}

interface TournamentPlayerDeckCreationAttributes
    extends Optional<TournamentPlayerDeckAttributes, 'id' | 'archetype_id' | 'snapshot_by_user_id' | 'created_at'> {}

/**
 * Snapshot du deck d'un joueur au moment du verrouillage des inscriptions.
 */
class TournamentPlayerDeck extends Model<TournamentPlayerDeckAttributes, TournamentPlayerDeckCreationAttributes>
    implements TournamentPlayerDeckAttributes {
    declare id: number;
    declare tournament_player_id: number;
    declare label: string;
    declare archetype_id: number | null;
    declare is_playable: boolean;
    declare snapshot_by_user_id: number | null;
    declare created_at?: Date;
}

TournamentPlayerDeck.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tournament_player_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'tournament_player', key: 'id' }
        },
        label: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        archetype_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: { model: 'archetype', key: 'id' }
        },
        is_playable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        snapshot_by_user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: { model: 'user', key: 'id' }
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        modelName: 'TournamentPlayerDeck',
        tableName: 'tournament_player_deck',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    }
);

export default TournamentPlayerDeck;
