import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

class WebsiteActions extends Model { }

WebsiteActions.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            defaultValue: 1
        },
        stream_banner_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        registration_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        sequelize,
        modelName: 'WebsiteActions',
        tableName: 'website_actions',
        timestamps: false,
        freezeTableName: true
    }
);

export default WebsiteActions;
