import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface PenaltyTypeAttributes {
    id: number;
    code: string;
    label: string;
    severity: number;
}

interface PenaltyTypeCreationAttributes extends Optional<PenaltyTypeAttributes, 'id'> {}

class PenaltyType extends Model<PenaltyTypeAttributes, PenaltyTypeCreationAttributes> implements PenaltyTypeAttributes {
    declare id: number;
    declare code: string;
    declare label: string;
    declare severity: number;
}

PenaltyType.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    label: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    severity: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'PenaltyType',
    tableName: 'penalty_type',
    timestamps: false
});

export default PenaltyType;
