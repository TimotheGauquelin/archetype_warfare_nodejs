import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize';

interface ArchetypeAttributeAttributes {
    archetype_id: number;
    attribute_id: number;
}

/**
 * Model representing an attribute inside an archetype
 */
class ArchetypeAttribute extends Model<ArchetypeAttributeAttributes, ArchetypeAttributeAttributes> implements ArchetypeAttributeAttributes {
    declare archetype_id: number;
    declare attribute_id: number;
}

ArchetypeAttribute.init(
    {
        archetype_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'archetype',
                key: 'id'
            }
        },
        attribute_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'attribute',
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: 'ArchetypeAttribute',
        tableName: 'archetype_attribute',
        timestamps: false
    }
);

export default ArchetypeAttribute;
