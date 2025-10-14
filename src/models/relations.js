import User from './UserModel.js';
import Deck from './DeckModel.js';
import DeckCard from './DeckCardModel.js';
import Card from './CardModel.js';
import Archetype from './ArchetypeModel.js';
import Era from './EraModel.js';
import Attribute from './AttributeModel.js';
import SummonMechanic from './SummonMechanicModel.js';
import Type from './TypeModel.js';
import Banlist from './BanlistModel.js';
import CardStatus from './CardStatusModel.js';
import BanlistArchetypeCard from './BanlistArchetypeCardModel.js';
import ArchetypeType from './ArchetypeTypeModel.js';
import ArchetypeAttribute from './ArchetypeAttributeModel.js';
import ArchetypeSummonMechanic from './ArchetypeSummonMechanicModel.js';
import Role from './RoleModel.js';
import UserRole from './UserRoleModel.js';

// Relations User
User.hasMany(Deck, { foreignKey: 'user_id' });
Deck.belongsTo(User, { foreignKey: 'user_id' });

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
Deck.hasMany(DeckCard, { foreignKey: 'deck_id' });
DeckCard.belongsTo(Deck, { foreignKey: 'deck_id' });

// Relations Card
Card.hasMany(DeckCard, { foreignKey: 'card_id' });
DeckCard.belongsTo(Card, { foreignKey: 'card_id' });

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
    as: 'cards'  // ✅ On peut utiliser 'cards' maintenant
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

export {
    User,
    Deck,
    DeckCard,
    Card,
    Archetype,
    Era,
    Attribute,
    SummonMechanic,
    Type,
    Banlist,
    CardStatus,
    BanlistArchetypeCard,
    ArchetypeType,
    ArchetypeAttribute,
    ArchetypeSummonMechanic,
    Role,
    UserRole
}; 