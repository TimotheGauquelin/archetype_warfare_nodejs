import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface QuizAnswerAttributes {
    id: number;
    attempt_id: string;
    question_id: number;
    answer: Record<string, unknown>;
    is_correct: boolean;
    points_awarded: number;
    answered_at?: Date;
}

type QuizAnswerCreationAttributes = Optional<
    QuizAnswerAttributes,
    'id' | 'is_correct' | 'points_awarded' | 'answered_at'
>;

class QuizAnswer
    extends Model<QuizAnswerAttributes, QuizAnswerCreationAttributes>
    implements QuizAnswerAttributes
{
    declare id: number;
    declare attempt_id: string;
    declare question_id: number;
    declare answer: Record<string, unknown>;
    declare is_correct: boolean;
    declare points_awarded: number;
    declare answered_at?: Date;
}

QuizAnswer.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        attempt_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        question_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        answer: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        is_correct: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        points_awarded: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        answered_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'QuizAnswer',
        tableName: 'quiz_answer',
        timestamps: false,
    }
);

export default QuizAnswer;
