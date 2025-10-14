import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

class ArchetypeType extends Model {}

/**
 * Model representing a type inside an archetype
 * @class ArchetypeType
 * @extends {Model}
 */
ArchetypeType.init(
    {
        archetype_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'archetype',
                key: 'id'
            }
        },
        type_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'type',
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: 'ArchetypeType',
        tableName: 'archetype_type',
        timestamps: false
    }
);

export default ArchetypeType; 