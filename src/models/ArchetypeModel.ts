import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface ArchetypeAttributes {
    id: number;
    name: string;
    main_info: string;
    slider_info: string;
    slider_img_url?: string | null;
    card_img_url?: string | null;
    is_highlighted: boolean;
    is_active: boolean;
    in_tcg_date: Date;
    in_aw_date: Date;
    comment?: string | null;
    popularity_poll: number;
    era_id: number;
    created_at?: Date;
    updated_at?: Date;
}

interface ArchetypeCreationAttributes extends Optional<ArchetypeAttributes, 'id' | 'slider_img_url' | 'card_img_url' | 'comment' | 'created_at' | 'updated_at'> {}

/**
 * Archetype model representing a group of card
 */
class Archetype extends Model<ArchetypeAttributes, ArchetypeCreationAttributes> implements ArchetypeAttributes {
    declare id: number;
    declare name: string;
    declare main_info: string;
    declare slider_info: string;
    declare slider_img_url?: string | null;
    declare card_img_url?: string | null;
    declare is_highlighted: boolean;
    declare is_active: boolean;
    declare in_tcg_date: Date;
    declare in_aw_date: Date;
    declare comment?: string | null;
    declare popularity_poll: number;
    declare era_id: number;
    declare created_at?: Date;
    declare updated_at?: Date;
}

Archetype.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    main_info: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    slider_info: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    slider_img_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    card_img_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    is_highlighted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    in_tcg_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    in_aw_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    popularity_poll: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    era_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'era',
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Archetype',
    tableName: 'archetype',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Archetype;
