"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMedal = exports.Medal = exports.QuizSeason = exports.QuizAnswer = exports.QuizAttempt = exports.QuizDaily = exports.QuizQuestion = exports.QuizTheme = exports.TournamentPlayerPenalty = exports.PenaltyType = exports.TournamentMatch = exports.TournamentRound = exports.TournamentPlayerDeckCard = exports.TournamentPlayerDeck = exports.TournamentPlayer = exports.Tournament = exports.WebsiteActions = exports.UserRole = exports.Role = exports.ArchetypeSummonMechanic = exports.ArchetypeAttribute = exports.ArchetypeType = exports.BanlistArchetypeCardReason = exports.BanlistReason = exports.BanlistArchetypeCard = exports.CardStatus = exports.Banlist = exports.Type = exports.SummonMechanic = exports.Attribute = exports.Era = exports.Archetype = exports.ArchetypeTranslation = exports.CardTranslation = exports.Card = exports.DeckCard = exports.Deck = exports.User = void 0;
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
const CardTranslationModel_1 = __importDefault(require("./CardTranslationModel"));
exports.CardTranslation = CardTranslationModel_1.default;
const ArchetypeTranslationModel_1 = __importDefault(require("./ArchetypeTranslationModel"));
exports.ArchetypeTranslation = ArchetypeTranslationModel_1.default;
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
const BanlistReasonModel_1 = __importDefault(require("./BanlistReasonModel"));
exports.BanlistReason = BanlistReasonModel_1.default;
const BanlistArchetypeCardReasonModel_1 = __importDefault(require("./BanlistArchetypeCardReasonModel"));
exports.BanlistArchetypeCardReason = BanlistArchetypeCardReasonModel_1.default;
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
const QuizThemeModel_1 = __importDefault(require("./QuizThemeModel"));
exports.QuizTheme = QuizThemeModel_1.default;
const QuizQuestionModel_1 = __importDefault(require("./QuizQuestionModel"));
exports.QuizQuestion = QuizQuestionModel_1.default;
const QuizDailyModel_1 = __importDefault(require("./QuizDailyModel"));
exports.QuizDaily = QuizDailyModel_1.default;
const QuizAttemptModel_1 = __importDefault(require("./QuizAttemptModel"));
exports.QuizAttempt = QuizAttemptModel_1.default;
const QuizAnswerModel_1 = __importDefault(require("./QuizAnswerModel"));
exports.QuizAnswer = QuizAnswerModel_1.default;
const QuizSeasonModel_1 = __importDefault(require("./QuizSeasonModel"));
exports.QuizSeason = QuizSeasonModel_1.default;
const MedalModel_1 = __importDefault(require("./MedalModel"));
exports.Medal = MedalModel_1.default;
const UserMedalModel_1 = __importDefault(require("./UserMedalModel"));
exports.UserMedal = UserMedalModel_1.default;
// Relations User
UserModel_1.default.hasMany(DeckModel_1.default, { foreignKey: 'user_id' });
DeckModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'user_id' });
// Médailles
UserModel_1.default.hasMany(UserMedalModel_1.default, { foreignKey: 'user_id', as: 'medals' });
UserMedalModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'user_id', as: 'user' });
MedalModel_1.default.hasMany(UserMedalModel_1.default, { foreignKey: 'medal_id', as: 'user_medals' });
UserMedalModel_1.default.belongsTo(MedalModel_1.default, { foreignKey: 'medal_id', as: 'medal' });
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
// Relations Quizz
QuizThemeModel_1.default.hasMany(QuizQuestionModel_1.default, { foreignKey: 'theme_id', as: 'questions' });
QuizQuestionModel_1.default.belongsTo(QuizThemeModel_1.default, { foreignKey: 'theme_id', as: 'theme' });
QuizThemeModel_1.default.hasMany(QuizDailyModel_1.default, { foreignKey: 'theme_id', as: 'dailies' });
QuizDailyModel_1.default.belongsTo(QuizThemeModel_1.default, { foreignKey: 'theme_id', as: 'theme' });
QuizThemeModel_1.default.hasMany(QuizAttemptModel_1.default, { foreignKey: 'theme_id', as: 'attempts' });
QuizAttemptModel_1.default.belongsTo(QuizThemeModel_1.default, { foreignKey: 'theme_id', as: 'theme' });
UserModel_1.default.hasMany(QuizAttemptModel_1.default, { foreignKey: 'user_id', as: 'quiz_attempts' });
QuizAttemptModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'user_id', as: 'user' });
QuizAttemptModel_1.default.hasMany(QuizAnswerModel_1.default, { foreignKey: 'attempt_id', as: 'answers' });
QuizAnswerModel_1.default.belongsTo(QuizAttemptModel_1.default, { foreignKey: 'attempt_id', as: 'attempt' });
QuizQuestionModel_1.default.hasMany(QuizAnswerModel_1.default, { foreignKey: 'question_id', as: 'answers' });
QuizAnswerModel_1.default.belongsTo(QuizQuestionModel_1.default, { foreignKey: 'question_id', as: 'question' });
QuizSeasonModel_1.default.hasMany(QuizQuestionModel_1.default, { foreignKey: 'season_id', as: 'questions' });
QuizQuestionModel_1.default.belongsTo(QuizSeasonModel_1.default, { foreignKey: 'season_id', as: 'season' });
QuizSeasonModel_1.default.hasMany(QuizDailyModel_1.default, { foreignKey: 'season_id', as: 'dailies' });
QuizDailyModel_1.default.belongsTo(QuizSeasonModel_1.default, { foreignKey: 'season_id', as: 'season' });
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
UserModel_1.default.belongsTo(ArchetypeModel_1.default, {
    foreignKey: 'loved_archetype_id',
    as: 'loved_archetype',
});
ArchetypeModel_1.default.hasMany(UserModel_1.default, {
    foreignKey: 'loved_archetype_id',
    as: 'fans',
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
CardModel_1.default.hasMany(CardTranslationModel_1.default, {
    foreignKey: 'card_id',
    as: 'translations'
});
CardTranslationModel_1.default.belongsTo(CardModel_1.default, {
    foreignKey: 'card_id',
    as: 'card'
});
ArchetypeModel_1.default.hasMany(ArchetypeTranslationModel_1.default, {
    foreignKey: 'archetype_id',
    as: 'translations'
});
ArchetypeTranslationModel_1.default.belongsTo(ArchetypeModel_1.default, {
    foreignKey: 'archetype_id',
    as: 'archetype'
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
// Raisons de banlist (M2M)
BanlistArchetypeCardModel_1.default.belongsToMany(BanlistReasonModel_1.default, {
    through: BanlistArchetypeCardReasonModel_1.default,
    foreignKey: 'banlist_archetype_card_id',
    otherKey: 'banlist_reason_id',
    as: 'reasons',
});
BanlistReasonModel_1.default.belongsToMany(BanlistArchetypeCardModel_1.default, {
    through: BanlistArchetypeCardReasonModel_1.default,
    foreignKey: 'banlist_reason_id',
    otherKey: 'banlist_archetype_card_id',
    as: 'banlist_archetype_cards',
});
BanlistArchetypeCardReasonModel_1.default.belongsTo(BanlistArchetypeCardModel_1.default, {
    foreignKey: 'banlist_archetype_card_id',
    as: 'banlist_archetype_card',
});
BanlistArchetypeCardReasonModel_1.default.belongsTo(BanlistReasonModel_1.default, {
    foreignKey: 'banlist_reason_id',
    as: 'reason',
});
//# sourceMappingURL=relations.js.map