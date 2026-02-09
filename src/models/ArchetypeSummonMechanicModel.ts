import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize';

interface ArchetypeSummonMechanicAttributes {
    archetype_id: number;
    summonmechanic_id: number;
}

/**
 * Model representing a summon mechanic inside an archetype
 */
class ArchetypeSummonMechanic extends Model<ArchetypeSummonMechanicAttributes, ArchetypeSummonMechanicAttributes> implements ArchetypeSummonMechanicAttributes {
    declare archetype_id: number;
    declare summonmechanic_id: number;
}

ArchetypeSummonMechanic.init(
    {
        archetype_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'archetype',
                key: 'id'
            }
        },
        summonmechanic_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'summonmechanic',
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: 'ArchetypeSummonMechanic',
        tableName: 'archetype_summonmechanic',
        timestamps: false
    }
);

export default ArchetypeSummonMechanic;
