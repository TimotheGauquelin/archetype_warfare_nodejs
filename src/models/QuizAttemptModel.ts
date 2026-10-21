import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type QuizAttemptMode = 'free' | 'daily';
export type QuizAttemptStatus = 'in_progress' | 'finished';

interface QuizAttemptAttributes {
    id: string;
    user_id: string;
    theme_id: number;
    mode: QuizAttemptMode;
    daily_date: string | null;
    status: QuizAttemptStatus;
    score: number;
    max_score: number;
    question_ids: number[];
    started_at?: Date;
    finished_at: Date | null;
    timer_started_at?: Date | null;
}

type QuizAttemptCreationAttributes = Optional<
    QuizAttemptAttributes,
    | 'id'
    | 'daily_date'
    | 'status'
    | 'score'
    | 'max_score'
    | 'started_at'
    | 'finished_at'
    | 'timer_started_at'
>;

class QuizAttempt
    extends Model<QuizAttemptAttributes, QuizAttemptCreationAttributes>
    implements QuizAttemptAttributes
{
    declare id: string;
    declare user_id: string;
    declare theme_id: number;
    declare mode: QuizAttemptMode;
    declare daily_date: string | null;
    declare status: QuizAttemptStatus;
    declare score: number;
    declare max_score: number;
    declare question_ids: number[];
    declare started_at?: Date;
    declare finished_at: Date | null;
    declare timer_started_at?: Date | null;
}

QuizAttempt.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        theme_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        mode: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        daily_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'in_progress',
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        max_score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        question_ids: {
            type: DataTypes.ARRAY(DataTypes.BIGINT),
            allowNull: false,
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        finished_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        timer_started_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'QuizAttempt',
        tableName: 'quiz_attempt',
        timestamps: false,
    }
);

export default QuizAttempt;
