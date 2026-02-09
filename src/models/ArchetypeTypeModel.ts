import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize';

interface ArchetypeTypeAttributes {
    archetype_id: number;
    type_id: number;
}

/**
 * Model representing a type inside an archetype
 */
class ArchetypeType extends Model<ArchetypeTypeAttributes, ArchetypeTypeAttributes> implements ArchetypeTypeAttributes {
    declare archetype_id: number;
    declare type_id: number;
}

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
