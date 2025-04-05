import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';

/**
 * Model representing a summon mechanic inside an archetype
 * @class ArchetypeSummonMechanic
 * @extends {Model}
 */
class ArchetypeSummonMechanic extends Model {}

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