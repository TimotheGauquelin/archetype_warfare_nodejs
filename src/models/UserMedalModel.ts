import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface UserMedalAttributes {
    id: number;
    user_id: string;
    medal_id: number;
    context_id: string;
    context_label: string | null;
    earned_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface UserMedalCreationAttributes
    extends Optional<
        UserMedalAttributes,
        'id' | 'context_id' | 'context_label' | 'earned_at' | 'created_at' | 'updated_at'
    > {}

class UserMedal
    extends Model<UserMedalAttributes, UserMedalCreationAttributes>
    implements UserMedalAttributes
{
    declare id: number;
    declare user_id: string;
    declare medal_id: number;
    declare context_id: string;
    declare context_label: string | null;
    declare earned_at: Date;
    declare created_at?: Date;
    declare updated_at?: Date;
}

UserMedal.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        medal_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        context_id: {
            type: DataTypes.STRING(64),
            allowNull: false,
            defaultValue: '',
        },
        context_label: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        earned_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'UserMedal',
        tableName: 'user_medal',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default UserMedal;
