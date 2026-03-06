"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentPlayerPenalty = exports.PenaltyType = exports.TournamentMatch = exports.TournamentRound = exports.TournamentPlayerDeckCard = exports.TournamentPlayerDeck = exports.TournamentPlayer = exports.Tournament = exports.WebsiteActions = exports.UserRole = exports.Role = exports.ArchetypeSummonMechanic = exports.ArchetypeAttribute = exports.ArchetypeType = exports.BanlistArchetypeCard = exports.CardStatus = exports.Banlist = exports.Type = exports.SummonMechanic = exports.Attribute = exports.Era = exports.Archetype = exports.Card = exports.DeckCard = exports.Deck = exports.User = void 0;
const UserModel_1 = __importDefault(require("./UserModel"));
exports.User = UserModel_1.default;
const DeckModel_1 = __importDefault(require("./DeckModel"));
exports.Deck = DeckModel_1.default;
const TournamentModel_1 = __importDefault(require("./TournamentModel"));
exports.Tournament = TournamentModel_1.default;
const TournamentPlayerModel_1 = __importDefault(require("./TournamentPlayerModel"));
exports.TournamentPlayer = TournamentPlayerModel_1.default;
const TournamentRoundModel_1 = __importDefault(require("./TournamentRoundModel"));
exports.TournamentRound = TournamentRoundModel_1.default;
const TournamentMatchModel_1 = __importDefault(require("./TournamentMatchModel"));
exports.TournamentMatch = TournamentMatchModel_1.default;
const TournamentPlayerDeckModel_1 = __importDefault(require("./TournamentPlayerDeckModel"));
exports.TournamentPlayerDeck = TournamentPlayerDeckModel_1.default;
const TournamentPlayerDeckCardModel_1 = __importDefault(require("./TournamentPlayerDeckCardModel"));
exports.TournamentPlayerDeckCard = TournamentPlayerDeckCardModel_1.default;
const DeckCardModel_1 = __importDefault(require("./DeckCardModel"));
exports.DeckCard = DeckCardModel_1.default;
const CardModel_1 = __importDefault(require("./CardModel"));
exports.Card = CardModel_1.default;
const ArchetypeModel_1 = __importDefault(require("./ArchetypeModel"));
exports.Archetype = ArchetypeModel_1.default;
const EraModel_1 = __importDefault(require("./EraModel"));
exports.Era = EraModel_1.default;
const AttributeModel_1 = __importDefault(require("./AttributeModel"));
exports.Attribute = AttributeModel_1.default;
const SummonMechanicModel_1 = __importDefault(require("./SummonMechanicModel"));
exports.SummonMechanic = SummonMechanicModel_1.default;
const TypeModel_1 = __importDefault(require("./TypeModel"));
exports.Type = TypeModel_1.default;
const BanlistModel_1 = __importDefault(require("./BanlistModel"));
exports.Banlist = BanlistModel_1.default;
const CardStatusModel_1 = __importDefault(require("./CardStatusModel"));
exports.CardStatus = CardStatusModel_1.default;
const BanlistArchetypeCardModel_1 = __importDefault(require("./BanlistArchetypeCardModel"));
exports.BanlistArchetypeCard = BanlistArchetypeCardModel_1.default;
const ArchetypeTypeModel_1 = __importDefault(require("./ArchetypeTypeModel"));
exports.ArchetypeType = ArchetypeTypeModel_1.default;
const ArchetypeAttributeModel_1 = __importDefault(require("./ArchetypeAttributeModel"));
exports.ArchetypeAttribute = ArchetypeAttributeModel_1.default;
const ArchetypeSummonMechanicModel_1 = __importDefault(require("./ArchetypeSummonMechanicModel"));
exports.ArchetypeSummonMechanic = ArchetypeSummonMechanicModel_1.default;
const RoleModel_1 = __importDefault(require("./RoleModel"));
exports.Role = RoleModel_1.default;
const UserRoleModel_1 = __importDefault(require("./UserRoleModel"));
exports.UserRole = UserRoleModel_1.default;
const WebsiteActionsModel_1 = __importDefault(require("./WebsiteActionsModel"));
exports.WebsiteActions = WebsiteActionsModel_1.default;
const PenaltyTypeModel_1 = __importDefault(require("./PenaltyTypeModel"));
exports.PenaltyType = PenaltyTypeModel_1.default;
const TournamentPlayerPenaltyModel_1 = __importDefault(require("./TournamentPlayerPenaltyModel"));
exports.TournamentPlayerPenalty = TournamentPlayerPenaltyModel_1.default;
// Relations User
UserModel_1.default.hasMany(DeckModel_1.default, { foreignKey: 'user_id' });
DeckModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'user_id' });
// Relations Tournoi
TournamentModel_1.default.hasMany(TournamentPlayerModel_1.default, { foreignKey: 'tournament_id', as: 'players' });
TournamentPlayerModel_1.default.belongsTo(TournamentModel_1.default, { foreignKey: 'tournament_id', as: 'tournament' });
TournamentPlayerModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'user_id', as: 'user' });
TournamentPlayerModel_1.default.belongsTo(DeckModel_1.default, { foreignKey: 'deck_id', as: 'deck' });
DeckModel_1.default.hasMany(TournamentPlayerModel_1.default, { foreignKey: 'deck_id', as: 'tournament_participations' });
UserModel_1.default.hasMany(TournamentPlayerModel_1.default, { foreignKey: 'user_id', as: 'tournament_registrations' });
TournamentModel_1.default.hasMany(TournamentRoundModel_1.default, { foreignKey: 'tournament_id', as: 'rounds' });
TournamentRoundModel_1.default.belongsTo(TournamentModel_1.default, { foreignKey: 'tournament_id', as: 'tournament' });
TournamentRoundModel_1.default.hasMany(TournamentMatchModel_1.default, { foreignKey: 'round_id', as: 'matches' });
TournamentMatchModel_1.default.belongsTo(TournamentRoundModel_1.default, { foreignKey: 'round_id', as: 'round' });
TournamentMatchModel_1.default.belongsTo(TournamentModel_1.default, { foreignKey: 'tournament_id', as: 'tournament' });
TournamentMatchModel_1.default.belongsTo(TournamentPlayerModel_1.default, { foreignKey: 'player1_tournament_player_id', as: 'player1' });
TournamentMatchModel_1.default.belongsTo(TournamentPlayerModel_1.default, { foreignKey: 'player2_tournament_player_id', as: 'player2' });
TournamentMatchModel_1.default.belongsTo(TournamentPlayerModel_1.default, { foreignKey: 'winner_tournament_player_id', as: 'winner' });
TournamentModel_1.default.hasMany(TournamentMatchModel_1.default, { foreignKey: 'tournament_id', as: 'matches' });
// Snapshot deck (liste figée au verrouillage des inscriptions)
TournamentPlayerModel_1.default.hasOne(TournamentPlayerDeckModel_1.default, { foreignKey: 'tournament_player_id', as: 'deck_snapshot' });
TournamentPlayerDeckModel_1.default.belongsTo(TournamentPlayerModel_1.default, { foreignKey: 'tournament_player_id' });
TournamentPlayerDeckModel_1.default.hasMany(TournamentPlayerDeckCardModel_1.default, { foreignKey: 'tournament_player_deck_id', as: 'cards' });
TournamentPlayerDeckCardModel_1.default.belongsTo(TournamentPlayerDeckModel_1.default, { foreignKey: 'tournament_player_deck_id' });
TournamentPlayerDeckCardModel_1.default.belongsTo(CardModel_1.default, { foreignKey: 'card_id', as: 'card' });
TournamentPlayerDeckModel_1.default.belongsTo(ArchetypeModel_1.default, { foreignKey: 'archetype_id', as: 'archetype' });
TournamentPlayerDeckModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'snapshot_by_user_id', as: 'snapshot_by' });
UserModel_1.default.hasMany(TournamentPlayerDeckModel_1.default, { foreignKey: 'snapshot_by_user_id', as: 'snapshotted_decks' });
// Pénalités (KDE / Konami)
TournamentPlayerModel_1.default.hasMany(TournamentPlayerPenaltyModel_1.default, { foreignKey: 'tournament_player_id', as: 'penalties' });
TournamentPlayerPenaltyModel_1.default.belongsTo(TournamentPlayerModel_1.default, { foreignKey: 'tournament_player_id' });
TournamentPlayerPenaltyModel_1.default.belongsTo(PenaltyTypeModel_1.default, { foreignKey: 'penalty_type_id', as: 'penalty_type' });
PenaltyTypeModel_1.default.hasMany(TournamentPlayerPenaltyModel_1.default, { foreignKey: 'penalty_type_id' });
TournamentPlayerPenaltyModel_1.default.belongsTo(TournamentRoundModel_1.default, { foreignKey: 'round_id', as: 'round' });
TournamentRoundModel_1.default.hasMany(TournamentPlayerPenaltyModel_1.default, { foreignKey: 'round_id' });
TournamentPlayerPenaltyModel_1.default.belongsTo(TournamentMatchModel_1.default, { foreignKey: 'tournament_match_id', as: 'tournament_match' });
TournamentMatchModel_1.default.hasMany(TournamentPlayerPenaltyModel_1.default, { foreignKey: 'tournament_match_id' });
TournamentPlayerPenaltyModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'applied_by_user_id', as: 'applied_by' });
UserModel_1.default.hasMany(TournamentPlayerPenaltyModel_1.default, { foreignKey: 'applied_by_user_id', as: 'applied_penalties' });
// Relations User-Role (Many-to-Many)
UserModel_1.default.belongsToMany(RoleModel_1.default, {
    through: UserRoleModel_1.default,
    foreignKey: 'user_id',
    as: 'roles'
});
RoleModel_1.default.belongsToMany(UserModel_1.default, {
    through: UserRoleModel_1.default,
    foreignKey: 'role_id',
    as: 'Users'
});
// Relations Deck
DeckModel_1.default.hasMany(DeckCardModel_1.default, {
    foreignKey: 'deck_id',
    as: 'deck_cards'
});
DeckModel_1.default.belongsTo(ArchetypeModel_1.default, { foreignKey: 'archetype_id', as: 'archetype' });
ArchetypeModel_1.default.hasMany(DeckModel_1.default, { foreignKey: 'archetype_id' });
DeckCardModel_1.default.belongsTo(DeckModel_1.default, {
    foreignKey: 'deck_id',
    as: 'deck'
});
// Relations Card
CardModel_1.default.hasMany(DeckCardModel_1.default, {
    foreignKey: 'card_id',
    as: 'deck_cards'
});
DeckCardModel_1.default.belongsTo(CardModel_1.default, {
    foreignKey: 'card_id',
    as: 'card'
});
// Relations Archetype
ArchetypeModel_1.default.belongsTo(EraModel_1.default, { foreignKey: 'era_id', as: 'era' });
EraModel_1.default.hasMany(ArchetypeModel_1.default, { foreignKey: 'era_id' });
// Relations ArchetypeType
TypeModel_1.default.belongsToMany(ArchetypeModel_1.default, {
    through: 'archetype_type',
    foreignKey: 'type_id',
    otherKey: 'archetype_id',
    timestamps: false,
    as: 'archetypes'
});
ArchetypeModel_1.default.belongsToMany(TypeModel_1.default, {
    through: 'archetype_type',
    foreignKey: 'archetype_id',
    otherKey: 'type_id',
    timestamps: false,
    as: 'types'
});
// Relations ArchetypeAttribute
AttributeModel_1.default.belongsToMany(ArchetypeModel_1.default, {
    through: 'archetype_attribute',
    foreignKey: 'attribute_id',
    otherKey: 'archetype_id',
    timestamps: false,
    as: 'archetypes'
});
ArchetypeModel_1.default.belongsToMany(AttributeModel_1.default, {
    through: 'archetype_attribute',
    foreignKey: 'archetype_id',
    otherKey: 'attribute_id',
    timestamps: false,
    as: 'attributes'
});
// Relations ArchetypeSummonMechanic
SummonMechanicModel_1.default.belongsToMany(ArchetypeModel_1.default, {
    through: 'archetype_summonmechanic',
    foreignKey: 'summonmechanic_id',
    otherKey: 'archetype_id',
    timestamps: false,
    as: 'archetypes'
});
ArchetypeModel_1.default.belongsToMany(SummonMechanicModel_1.default, {
    through: 'archetype_summonmechanic',
    foreignKey: 'archetype_id',
    otherKey: 'summonmechanic_id',
    timestamps: false,
    as: 'summon_mechanics'
});
// Relations BanlistArchetypeCard
BanlistModel_1.default.hasMany(BanlistArchetypeCardModel_1.default, {
    foreignKey: 'banlist_id',
    as: 'banlist_archetype_cards'
});
BanlistArchetypeCardModel_1.default.belongsTo(BanlistModel_1.default, {
    foreignKey: 'banlist_id',
    as: 'banlist'
});
// Relations Archetype et BanlistArchetypeCard
ArchetypeModel_1.default.hasMany(BanlistArchetypeCardModel_1.default, {
    foreignKey: 'archetype_id',
    as: 'cards'
});
BanlistArchetypeCardModel_1.default.belongsTo(ArchetypeModel_1.default, {
    foreignKey: 'archetype_id',
    as: 'archetype'
});
// Relations Card et BanlistArchetypeCard
CardModel_1.default.hasMany(BanlistArchetypeCardModel_1.default, {
    foreignKey: 'card_id',
    as: 'banlist_archetype_cards'
});
BanlistArchetypeCardModel_1.default.belongsTo(CardModel_1.default, {
    foreignKey: 'card_id',
    as: 'card'
});
// Relations CardStatus et BanlistArchetypeCard
CardStatusModel_1.default.hasMany(BanlistArchetypeCardModel_1.default, {
    foreignKey: 'card_status_id',
    as: 'banlist_archetype_cards'
});
BanlistArchetypeCardModel_1.default.belongsTo(CardStatusModel_1.default, {
    foreignKey: 'card_status_id',
    as: 'card_status'
});
//# sourceMappingURL=relations.js.map