import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * SummonMechanic model representing a summon mechanic in the game
 * @class SummonMechanic
 * @extends {Model}
 */
class SummonMechanic extends Model {}

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