import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface ArchetypeTranslationAttributes {
    archetype_id: number;
    locale: string;
    name: string;
    main_info?: string | null;
    slider_info?: string | null;
    comment?: string | null;
}

interface ArchetypeTranslationCreationAttributes
    extends Optional<ArchetypeTranslationAttributes, 'main_info' | 'slider_info' | 'comment'> {}

/**
 * Traductions d'un archétype (une ligne par locale).
 */
class ArchetypeTranslation
    extends Model<ArchetypeTranslationAttributes, ArchetypeTranslationCreationAttributes>
    implements ArchetypeTranslationAttributes
{
    declare archetype_id: number;
    declare locale: string;
    declare name: string;
    declare main_info?: string | null;
    declare slider_info?: string | null;
    declare comment?: string | null;
}

ArchetypeTranslation.init(
    {
        archetype_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'archetype',
                key: 'id',
            },
        },
        locale: {
            type: DataTypes.STRING(5),
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        main_info: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        slider_info: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'ArchetypeTranslation',
        tableName: 'archetype_translation',
        timestamps: false,
    }
);

export default ArchetypeTranslation;
