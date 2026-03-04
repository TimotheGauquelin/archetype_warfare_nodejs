import User from './UserModel';
import Deck from './DeckModel';
import Tournament from './TournamentModel';
import TournamentPlayer from './TournamentPlayerModel';
import TournamentRound from './TournamentRoundModel';
import TournamentMatch from './TournamentMatchModel';
import TournamentPlayerDeck from './TournamentPlayerDeckModel';
import TournamentPlayerDeckCard from './TournamentPlayerDeckCardModel';
import DeckCard from './DeckCardModel';
import Card from './CardModel';
import Archetype from './ArchetypeModel';
import Era from './EraModel';
import Attribute from './AttributeModel';
import SummonMechanic from './SummonMechanicModel';
import Type from './TypeModel';
import Banlist from './BanlistModel';
import CardStatus from './CardStatusModel';
import BanlistArchetypeCard from './BanlistArchetypeCardModel';
import ArchetypeType from './ArchetypeTypeModel';
import ArchetypeAttribute from './ArchetypeAttributeModel';
import ArchetypeSummonMechanic from './ArchetypeSummonMechanicModel';
import Role from './RoleModel';
import UserRole from './UserRoleModel';
import WebsiteActions from './WebsiteActionsModel';
// Relations User
User.hasMany(Deck, { foreignKey: 'user_id' });
Deck.belongsTo(User, { foreignKey: 'user_id' });
// Relations Tournoi
Tournament.hasMany(TournamentPlayer, { foreignKey: 'tournament_id', as: 'players' });
TournamentPlayer.belongsTo(Tournament, { foreignKey: 'tournament_id', as: 'tournament' });
TournamentPlayer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
TournamentPlayer.belongsTo(Deck, { foreignKey: 'deck_id', as: 'deck' });
Deck.hasMany(TournamentPlayer, { foreignKey: 'deck_id', as: 'tournament_participations' });
User.hasMany(TournamentPlayer, { foreignKey: 'user_id', as: 'tournament_registrations' });
Tournament.hasMany(TournamentRound, { foreignKey: 'tournament_id', as: 'rounds' });
TournamentRound.belongsTo(Tournament, { foreignKey: 'tournament_id', as: 'tournament' });
TournamentRound.hasMany(TournamentMatch, { foreignKey: 'round_id', as: 'matches' });
TournamentMatch.belongsTo(TournamentRound, { foreignKey: 'round_id', as: 'round' });
TournamentMatch.belongsTo(Tournament, { foreignKey: 'tournament_id', as: 'tournament' });
TournamentMatch.belongsTo(TournamentPlayer, { foreignKey: 'player1_tournament_player_id', as: 'player1' });
TournamentMatch.belongsTo(TournamentPlayer, { foreignKey: 'player2_tournament_player_id', as: 'player2' });
TournamentMatch.belongsTo(TournamentPlayer, { foreignKey: 'winner_tournament_player_id', as: 'winner' });
Tournament.hasMany(TournamentMatch, { foreignKey: 'tournament_id', as: 'matches' });
// Snapshot deck (liste figée au verrouillage des inscriptions)
TournamentPlayer.hasOne(TournamentPlayerDeck, { foreignKey: 'tournament_player_id', as: 'deck_snapshot' });
TournamentPlayerDeck.belongsTo(TournamentPlayer, { foreignKey: 'tournament_player_id' });
TournamentPlayerDeck.hasMany(TournamentPlayerDeckCard, { foreignKey: 'tournament_player_deck_id', as: 'cards' });
TournamentPlayerDeckCard.belongsTo(TournamentPlayerDeck, { foreignKey: 'tournament_player_deck_id' });
TournamentPlayerDeckCard.belongsTo(Card, { foreignKey: 'card_id', as: 'card' });
TournamentPlayerDeck.belongsTo(Archetype, { foreignKey: 'archetype_id', as: 'archetype' });
// Relations User-Role (Many-to-Many)
User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    as: 'roles'
});
Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    as: 'Users'
});
// Relations Deck
Deck.hasMany(DeckCard, {
    foreignKey: 'deck_id',
    as: 'deck_cards'
});
Deck.belongsTo(Archetype, { foreignKey: 'archetype_id', as: 'archetype' });
Archetype.hasMany(Deck, { foreignKey: 'archetype_id' });
DeckCard.belongsTo(Deck, {
    foreignKey: 'deck_id',
    as: 'deck'
});
// Relations Card
Card.hasMany(DeckCard, {
    foreignKey: 'card_id',
    as: 'deck_cards'
});
DeckCard.belongsTo(Card, {
    foreignKey: 'card_id',
    as: 'card'
});
// Relations Archetype
Archetype.belongsTo(Era, { foreignKey: 'era_id', as: 'era' });
Era.hasMany(Archetype, { foreignKey: 'era_id' });
// Relations ArchetypeType
Type.belongsToMany(Archetype, {
    through: 'archetype_type',
    foreignKey: 'type_id',
    otherKey: 'archetype_id',
    timestamps: false,
    as: 'archetypes'
});
Archetype.belongsToMany(Type, {
    through: 'archetype_type',
    foreignKey: 'archetype_id',
    otherKey: 'type_id',
    timestamps: false,
    as: 'types'
});
// Relations ArchetypeAttribute
Attribute.belongsToMany(Archetype, {
    through: 'archetype_attribute',
    foreignKey: 'attribute_id',
    otherKey: 'archetype_id',
    timestamps: false,
    as: 'archetypes'
});
Archetype.belongsToMany(Attribute, {
    through: 'archetype_attribute',
    foreignKey: 'archetype_id',
    otherKey: 'attribute_id',
    timestamps: false,
    as: 'attributes'
});
// Relations ArchetypeSummonMechanic
SummonMechanic.belongsToMany(Archetype, {
    through: 'archetype_summonmechanic',
    foreignKey: 'summonmechanic_id',
    otherKey: 'archetype_id',
    timestamps: false,
    as: 'archetypes'
});
Archetype.belongsToMany(SummonMechanic, {
    through: 'archetype_summonmechanic',
    foreignKey: 'archetype_id',
    otherKey: 'summonmechanic_id',
    timestamps: false,
    as: 'summon_mechanics'
});
// Relations BanlistArchetypeCard
Banlist.hasMany(BanlistArchetypeCard, {
    foreignKey: 'banlist_id',
    as: 'banlist_archetype_cards'
});
BanlistArchetypeCard.belongsTo(Banlist, {
    foreignKey: 'banlist_id',
    as: 'banlist'
});
// Relations Archetype et BanlistArchetypeCard
Archetype.hasMany(BanlistArchetypeCard, {
    foreignKey: 'archetype_id',
    as: 'cards'
});
BanlistArchetypeCard.belongsTo(Archetype, {
    foreignKey: 'archetype_id',
    as: 'archetype'
});
// Relations Card et BanlistArchetypeCard
Card.hasMany(BanlistArchetypeCard, {
    foreignKey: 'card_id',
    as: 'banlist_archetype_cards'
});
BanlistArchetypeCard.belongsTo(Card, {
    foreignKey: 'card_id',
    as: 'card'
});
// Relations CardStatus et BanlistArchetypeCard
CardStatus.hasMany(BanlistArchetypeCard, {
    foreignKey: 'card_status_id',
    as: 'banlist_archetype_cards'
});
BanlistArchetypeCard.belongsTo(CardStatus, {
    foreignKey: 'card_status_id',
    as: 'card_status'
});
export { User, Deck, DeckCard, Card, Archetype, Era, Attribute, SummonMechanic, Type, Banlist, CardStatus, BanlistArchetypeCard, ArchetypeType, ArchetypeAttribute, ArchetypeSummonMechanic, Role, UserRole, WebsiteActions, Tournament, TournamentPlayer, TournamentPlayerDeck, TournamentPlayerDeckCard, TournamentRound, TournamentMatch };
//# sourceMappingURL=relations.js.map