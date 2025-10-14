import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * Era model representing the period in which the archetype was created
 * @class Era
 * @extends {Model}
 */
class Era extends Model {}

Era.init(
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
        modelName: 'Era',
        tableName: 'era',
        timestamps: false,
    }
);

export default Era; 