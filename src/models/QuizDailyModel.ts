import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface QuizDailyAttributes {
    id: number;
    quiz_date: string;
    theme_id: number;
    question_ids: number[];
    season_id?: number | null;
    created_at?: Date;
}

type QuizDailyCreationAttributes = Optional<
    QuizDailyAttributes,
    'id' | 'season_id' | 'created_at'
>;

class QuizDaily
    extends Model<QuizDailyAttributes, QuizDailyCreationAttributes>
    implements QuizDailyAttributes
{
    declare id: number;
    declare quiz_date: string;
    declare theme_id: number;
    declare question_ids: number[];
    declare season_id?: number | null;
    declare created_at?: Date;
}

QuizDaily.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        quiz_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        theme_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        question_ids: {
            type: DataTypes.ARRAY(DataTypes.BIGINT),
            allowNull: false,
        },
        season_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'QuizDaily',
        tableName: 'quiz_daily',
        timestamps: false,
    }
);

export default QuizDaily;
