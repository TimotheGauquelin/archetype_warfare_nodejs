import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface EraAttributes {
    id: number;
    label: string;
}

interface EraCreationAttributes extends Optional<EraAttributes, 'id'> {}

/**
 * Era model representing the period in which the archetype was created
 */
class Era extends Model<EraAttributes, EraCreationAttributes> implements EraAttributes {
    declare id: number;
    declare label: string;
}

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
