import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * Model representing an attribute inside an archetype
 * @class ArchetypeAttribute
 * @extends {Model}
 */
class ArchetypeAttribute extends Model {}

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