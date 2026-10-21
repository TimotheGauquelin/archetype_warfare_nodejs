import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface QuizSeasonAttributes {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    created_at?: Date;
    updated_at?: Date;
}

type QuizSeasonCreationAttributes = Optional<
    QuizSeasonAttributes,
    'id' | 'created_at' | 'updated_at'
>;

class QuizSeason
    extends Model<QuizSeasonAttributes, QuizSeasonCreationAttributes>
    implements QuizSeasonAttributes
{
    declare id: number;
    declare name: string;
    declare start_date: string;
    declare end_date: string;
    declare created_at?: Date;
    declare updated_at?: Date;
}

QuizSeason.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'QuizSeason',
        tableName: 'quiz_season',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default QuizSeason;
