import Type from './TypeModel.js';
import Archetype from './ArchetypeModel.js';
// Type relations
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
    as: 'archetypeTypes'
});
