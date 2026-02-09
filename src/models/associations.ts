import Banlist from './BanlistModel';
import BanlistArchetypeCard from './BanlistArchetypeCardModel';
import Card from './CardModel';
import Archetype from './ArchetypeModel';
import Deck from './DeckModel';
import DeckCard from './DeckCardModel';
import User from './UserModel';
import Role from './RoleModel';
import CardType from './CardTypeModel';
import Era from './EraModel';
import Attribute from './AttributeModel';
import SummonMechanic from './SummonMechanicModel';
import CardStatus from './CardStatusModel';
import ArchetypeType from './ArchetypeTypeModel';
import ArchetypeAttribute from './ArchetypeAttributeModel';
import ArchetypeSummonMechanic from './ArchetypeSummonMechanicModel';

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

BanlistArchetypeCard.belongsTo(CardStatus, {
    foreignKey: 'card_status_id',
    as: 'card_status'
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

// Relations CardStatus
CardStatus.hasMany(BanlistArchetypeCard, {
    foreignKey: 'card_status_id',
    as: 'banlist_entries'
});

// Associations ArchetypeType
Archetype.hasMany(ArchetypeType, {
    foreignKey: 'archetype_id',
    as: 'archetype_types'
});
ArchetypeType.belongsTo(Archetype, {
    foreignKey: 'archetype_id',
    as: 'archetype'
});
CardType.hasMany(ArchetypeType, {
    foreignKey: 'type_id',
    as: 'archetype_types'
});
ArchetypeType.belongsTo(CardType, {
    foreignKey: 'type_id',
    as: 'card_type'
});

// Associations ArchetypeAttribute
Archetype.hasMany(ArchetypeAttribute, {
    foreignKey: 'archetype_id',
    as: 'archetype_attributes'
});
ArchetypeAttribute.belongsTo(Archetype, {
    foreignKey: 'archetype_id',
    as: 'archetype'
});
Attribute.hasMany(ArchetypeAttribute, {
    foreignKey: 'attribute_id',
    as: 'archetype_attributes'
});
ArchetypeAttribute.belongsTo(Attribute, {
    foreignKey: 'attribute_id',
    as: 'attribute'
});

// Associations ArchetypeSummonMechanic
Archetype.hasMany(ArchetypeSummonMechanic, {
    foreignKey: 'archetype_id',
    as: 'archetype_summon_mechanics'
});
ArchetypeSummonMechanic.belongsTo(Archetype, {
    foreignKey: 'archetype_id',
    as: 'archetype'
});
SummonMechanic.hasMany(ArchetypeSummonMechanic, {
    foreignKey: 'summonmechanic_id',
    as: 'archetype_summon_mechanics'
});
ArchetypeSummonMechanic.belongsTo(SummonMechanic, {
    foreignKey: 'summonmechanic_id',
    as: 'summon_mechanic'
});

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
