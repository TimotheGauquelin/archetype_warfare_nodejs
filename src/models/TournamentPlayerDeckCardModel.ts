import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface TournamentPlayerDeckCardAttributes {
    id: number;
    tournament_player_deck_id: number;
    card_id: string;
    quantity: number;
}

interface TournamentPlayerDeckCardCreationAttributes
    extends Optional<TournamentPlayerDeckCardAttributes, 'id'> {}

/**
 * Carte dans le snapshot du deck d'un joueur pour un tournoi.
 */
class TournamentPlayerDeckCard
    extends Model<TournamentPlayerDeckCardAttributes, TournamentPlayerDeckCardCreationAttributes>
    implements TournamentPlayerDeckCardAttributes {
    declare id: number;
    declare tournament_player_deck_id: number;
    declare card_id: string;
    declare quantity: number;
}

TournamentPlayerDeckCard.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tournament_player_deck_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'tournament_player_deck', key: 'id' }
        },
        card_id: {
            type: DataTypes.STRING(8),
            allowNull: false,
            references: { model: 'card', key: 'id' }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 3 }
        }
    },
    {
        sequelize,
        modelName: 'TournamentPlayerDeckCard',
        tableName: 'tournament_player_deck_card',
        timestamps: false
    }
);

export default TournamentPlayerDeckCard;
