import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

export type QuizQuestionType =
    | 'mcq'
    | 'true_false'
    | 'order'
    | 'artwork_guess'
    | 'name_the_cards'
    | 'summoner'
    | 'zoom'
    | 'hint_ladder';
export type QuizQuestionDifficulty = 'easy' | 'medium' | 'hard';

interface QuizQuestionAttributes {
    id: number;
    theme_id: number;
    type: QuizQuestionType;
    prompt: string;
    payload: Record<string, unknown>;
    points: number;
    is_active: boolean;
    image_url?: string | null;
    hint?: string | null;
    explanation?: string | null;
    difficulty: QuizQuestionDifficulty;
    /** Déjà utilisée / planifiée en Daily : non replanifiable ailleurs */
    was_daily_question: boolean;
    /** Secondes pour le défi du jour : 0 = pas de chrono, max 30 */
    daily_time_limit_seconds: number;
    /** Saison de Daily Quizz (si question du pool daily) */
    season_id?: number | null;
    /** Jour du défi du jour dans la saison (1 question / jour) */
    scheduled_date?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

type QuizQuestionCreationAttributes = Optional<
    QuizQuestionAttributes,
    | 'id'
    | 'payload'
    | 'points'
    | 'is_active'
    | 'image_url'
    | 'hint'
    | 'explanation'
    | 'difficulty'
    | 'was_daily_question'
    | 'daily_time_limit_seconds'
    | 'season_id'
    | 'scheduled_date'
    | 'created_at'
    | 'updated_at'
>;

class QuizQuestion
    extends Model<QuizQuestionAttributes, QuizQuestionCreationAttributes>
    implements QuizQuestionAttributes
{
    declare id: number;
    declare theme_id: number;
    declare type: QuizQuestionType;
    declare prompt: string;
    declare payload: Record<string, unknown>;
    declare points: number;
    declare is_active: boolean;
    declare image_url?: string | null;
    declare hint?: string | null;
    declare explanation?: string | null;
    declare difficulty: QuizQuestionDifficulty;
    declare was_daily_question: boolean;
    declare daily_time_limit_seconds: number;
    declare season_id?: number | null;
    declare scheduled_date?: string | null;
    declare created_at?: Date;
    declare updated_at?: Date;
}

QuizQuestion.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        theme_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        prompt: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        payload: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        image_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        hint: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        explanation: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        difficulty: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'medium',
        },
        was_daily_question: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        daily_time_limit_seconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        season_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        scheduled_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
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
        modelName: 'QuizQuestion',
        tableName: 'quiz_question',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default QuizQuestion;
