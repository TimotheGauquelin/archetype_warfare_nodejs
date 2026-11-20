import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface QuizSeasonArchetypeAttributes {
    season_id: number;
    archetype_id: number;
    created_at?: Date;
}

type QuizSeasonArchetypeCreationAttributes = Optional<
    QuizSeasonArchetypeAttributes,
    'created_at'
>;

/**
 * Archétype autorisé dans le pool jouable d'une saison plateforme.
 * Pool vide pour une saison = tous les archétypes autorisés.
 */
class QuizSeasonArchetype
    extends Model<QuizSeasonArchetypeAttributes, QuizSeasonArchetypeCreationAttributes>
    implements QuizSeasonArchetypeAttributes
{
    declare season_id: number;
    declare archetype_id: number;
    declare created_at?: Date;
}

QuizSeasonArchetype.init(
    {
        season_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'quiz_season',
                key: 'id',
            },
        },
        archetype_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'archetype',
                key: 'id',
            },
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'QuizSeasonArchetype',
        tableName: 'quiz_season_archetype',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    }
);

export default QuizSeasonArchetype;
