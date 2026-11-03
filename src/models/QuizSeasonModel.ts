import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface QuizSeasonAttributes {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    image_url: string | null;
    image_focal_x: number;
    image_focal_y: number;
    image_zoom: number;
    allows_overlap: boolean;
    created_at?: Date;
    updated_at?: Date;
}

type QuizSeasonCreationAttributes = Optional<
    QuizSeasonAttributes,
    | 'id'
    | 'image_url'
    | 'image_focal_x'
    | 'image_focal_y'
    | 'image_zoom'
    | 'allows_overlap'
    | 'created_at'
    | 'updated_at'
>;

class QuizSeason
    extends Model<QuizSeasonAttributes, QuizSeasonCreationAttributes>
    implements QuizSeasonAttributes
{
    declare id: number;
    declare name: string;
    declare start_date: string;
    declare end_date: string;
    declare image_url: string | null;
    declare image_focal_x: number;
    declare image_focal_y: number;
    declare image_zoom: number;
    declare allows_overlap: boolean;
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
        image_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image_focal_x: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 50,
        },
        image_focal_y: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 50,
        },
        image_zoom: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 100,
        },
        allows_overlap: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
