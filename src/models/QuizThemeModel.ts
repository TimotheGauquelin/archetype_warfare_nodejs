import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface QuizThemeAttributes {
    id: number;
    slug: string;
    label: string;
    description: string | null;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

type QuizThemeCreationAttributes = Optional<
    QuizThemeAttributes,
    'id' | 'description' | 'is_active' | 'created_at' | 'updated_at'
>;

class QuizTheme
    extends Model<QuizThemeAttributes, QuizThemeCreationAttributes>
    implements QuizThemeAttributes
{
    declare id: number;
    declare slug: string;
    declare label: string;
    declare description: string | null;
    declare is_active: boolean;
    declare created_at?: Date;
    declare updated_at?: Date;
}

QuizTheme.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        slug: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        label: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        modelName: 'QuizTheme',
        tableName: 'quiz_theme',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default QuizTheme;
