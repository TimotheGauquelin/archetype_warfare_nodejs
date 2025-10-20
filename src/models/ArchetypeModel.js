import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

/**
 * Archetype model representing a group of card
 * @class Archetype
 * @extends {Model}
 */
class Archetype extends Model { }

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