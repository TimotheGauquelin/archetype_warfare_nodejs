import Banlist from './BanlistModel.js';
import BanlistArchetypeCard from './BanlistArchetypeCardModel.js';
import Card from './CardModel.js';
import Archetype from './ArchetypeModel.js';
import Deck from './DeckModel.js';
import DeckCard from './DeckCardModel.js';
import User from './UserModel.js';
import Role from './RoleModel.js';
import CardType from './CardTypeModel.js';
import Era from './EraModel.js';
import Attribute from './AttributeModel.js';
import SummonMechanic from './SummonMechanicModel.js';
import CardStatus from './CardStatusModel.js';
import ArchetypeType from './ArchetypeTypeModel.js';
import ArchetypeAttribute from './ArchetypeAttributeModeljs';
import ArchetypeSummonMechanic from './ArchetypeSummonMechanicModel.js';

// Relations Banlist
Banlist.hasMany(BanlistArchetypeCard, {
    foreignKey: 'banlist_id',
    as: 'banlist_cards'
});

// Relations BanlistArchetypeCard
BanlistArchetypeCard.belongsTo(Banlist, {
    foreignKey: 'banlist_id',
    as: 'banlist'
});

BanlistArchetypeCard.belongsTo(Card, {
    foreignKey: 'card_id',
    as: 'card'
});

BanlistArchetypeCard.belongsTo(Archetype, {
    foreignKey: 'archetype_id',
    as: 'archetype'
});

// Relations Card
Card.belongsTo(Archetype, {
    foreignKey: 'archetype_id',
    as: 'archetype'
});

Card.belongsTo(Era, {
    foreignKey: 'era_id',
    as: 'era'
});

Card.belongsTo(Attribute, {
    foreignKey: 'attribute_id',
    as: 'attribute'
});

Card.belongsTo(SummonMechanic, {
    foreignKey: 'summon_mechanic_id',
    as: 'summon_mechanic'
});

Card.hasMany(DeckCard, {
    foreignKey: 'card_id',
    as: 'deck_cards'
});

Card.hasMany(BanlistArchetypeCard, {
    foreignKey: 'card_id',
    as: 'banlist_entries'
});

// Relations Deck
Deck.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

Deck.hasMany(DeckCard, {
    foreignKey: 'deck_id',
    as: 'deck_cards'
});

// Relations DeckCard
DeckCard.belongsTo(Deck, {
    foreignKey: 'deck_id',
    as: 'deck'
});

DeckCard.belongsTo(Card, {
    foreignKey: 'card_id',
    as: 'card'
});

// Relations User
User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
});

User.hasMany(Deck, {
    foreignKey: 'user_id',
    as: 'decks'
});

// Relations Archetype
Archetype.hasMany(Card, {
    foreignKey: 'archetype_id',
    as: 'cards'
});

Archetype.hasMany(BanlistArchetypeCard, {
    foreignKey: 'archetype_id',
    as: 'banlist_entries'
});

// Relations Era
Era.hasMany(Card, {
    foreignKey: 'era_id',
    as: 'cards'
});

// Relations Attribute
Attribute.hasMany(Card, {
    foreignKey: 'attribute_id',
    as: 'cards'
});

// Relations SummonMechanic
SummonMechanic.hasMany(Card, {
    foreignKey: 'summon_mechanic_id',
    as: 'cards'
});

// Relations Role
Role.hasMany(User, {
    foreignKey: 'role_id',
    as: 'users'
});

// Associations ArchetypeType
Archetype.hasMany(ArchetypeType, { foreignKey: 'archetype_id' });
ArchetypeType.belongsTo(Archetype, { foreignKey: 'archetype_id' });
CardType.hasMany(ArchetypeType, { foreignKey: 'type_id' });
ArchetypeType.belongsTo(CardType, { foreignKey: 'type_id' });

// Associations ArchetypeAttribute
Archetype.hasMany(ArchetypeAttribute, { foreignKey: 'archetype_id' });
ArchetypeAttribute.belongsTo(Archetype, { foreignKey: 'archetype_id' });
Attribute.hasMany(ArchetypeAttribute, { foreignKey: 'attribute_id' });
ArchetypeAttribute.belongsTo(Attribute, { foreignKey: 'attribute_id' });

// Associations ArchetypeSummonMechanic
Archetype.hasMany(ArchetypeSummonMechanic, { foreignKey: 'archetype_id' });
ArchetypeSummonMechanic.belongsTo(Archetype, { foreignKey: 'archetype_id' });
SummonMechanic.hasMany(ArchetypeSummonMechanic, { foreignKey: 'summonmechanic_id' });
ArchetypeSummonMechanic.belongsTo(SummonMechanic, { foreignKey: 'summonmechanic_id' });

// Associations BanlistArchetypeCard
Banlist.hasMany(BanlistArchetypeCard, { foreignKey: 'banlist_id' });
BanlistArchetypeCard.belongsTo(Banlist, { foreignKey: 'banlist_id' });
Archetype.hasMany(BanlistArchetypeCard, { foreignKey: 'archetype_id' });
BanlistArchetypeCard.belongsTo(Archetype, { foreignKey: 'archetype_id' });
Card.hasMany(BanlistArchetypeCard, { foreignKey: 'card_id' });
BanlistArchetypeCard.belongsTo(Card, { foreignKey: 'card_id' });
CardStatus.hasMany(BanlistArchetypeCard, { foreignKey: 'card_status_id' });
BanlistArchetypeCard.belongsTo(CardStatus, { foreignKey: 'card_status_id' });

export {
    Banlist,
    BanlistArchetypeCard,
    Card,
    Archetype,
    Deck,
    DeckCard,
    User,
    Role,
    CardType,
    Era,
    Attribute,
    SummonMechanic,
    CardStatus,
    ArchetypeType,
    ArchetypeAttribute,
    ArchetypeSummonMechanic
}; 