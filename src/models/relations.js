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
Archetype.belongsTo(Era, { foreignKey: 'era_id' });
Era.hasMany(Archetype, { foreignKey: 'era_id' });

// Relations ArchetypeType
Archetype.hasMany(ArchetypeType, { foreignKey: 'archetype_id' });
ArchetypeType.belongsTo(Archetype, { foreignKey: 'archetype_id' });
Type.hasMany(ArchetypeType, { foreignKey: 'type_id' });
ArchetypeType.belongsTo(Type, { foreignKey: 'type_id' });

// Relations ArchetypeAttribute
Archetype.hasMany(ArchetypeAttribute, { foreignKey: 'archetype_id' });
ArchetypeAttribute.belongsTo(Archetype, { foreignKey: 'archetype_id' });
Attribute.hasMany(ArchetypeAttribute, { foreignKey: 'attribute_id' });
ArchetypeAttribute.belongsTo(Attribute, { foreignKey: 'attribute_id' });

// Relations ArchetypeSummonMechanic
Archetype.hasMany(ArchetypeSummonMechanic, { foreignKey: 'archetype_id' });
ArchetypeSummonMechanic.belongsTo(Archetype, { foreignKey: 'archetype_id' });
SummonMechanic.hasMany(ArchetypeSummonMechanic, { foreignKey: 'summonmechanic_id' });
ArchetypeSummonMechanic.belongsTo(SummonMechanic, { foreignKey: 'summonmechanic_id' });

// Relations BanlistArchetypeCard
Banlist.hasMany(BanlistArchetypeCard, { foreignKey: 'banlist_id' });
BanlistArchetypeCard.belongsTo(Banlist, { foreignKey: 'banlist_id' });
Archetype.hasMany(BanlistArchetypeCard, { foreignKey: 'archetype_id' });
BanlistArchetypeCard.belongsTo(Archetype, { foreignKey: 'archetype_id' });
Card.hasMany(BanlistArchetypeCard, { foreignKey: 'card_id' });
BanlistArchetypeCard.belongsTo(Card, { foreignKey: 'card_id' });
CardStatus.hasMany(BanlistArchetypeCard, { foreignKey: 'card_status_id' });
BanlistArchetypeCard.belongsTo(CardStatus, { foreignKey: 'card_status_id' });

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