import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface SummonMechanicAttributes {
    id: number;
    label: string;
}

interface SummonMechanicCreationAttributes extends Optional<SummonMechanicAttributes, 'id'> {}

/**
 * SummonMechanic model representing a summon mechanic in the game
 */
class SummonMechanic extends Model<SummonMechanicAttributes, SummonMechanicCreationAttributes> implements SummonMechanicAttributes {
    declare id: number;
    declare label: string;
}

SummonMechanic.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        label: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true
        }
    },
    {
        sequelize,
        modelName: 'SummonMechanic',
        tableName: 'summonmechanic',
        timestamps: false
    }
);

export default SummonMechanic;
