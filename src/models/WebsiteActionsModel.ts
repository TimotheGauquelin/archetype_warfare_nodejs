import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface WebsiteActionsAttributes {
    id: number;
    stream_banner_enabled: boolean;
    registration_enabled: boolean;
}

interface WebsiteActionsCreationAttributes extends Optional<WebsiteActionsAttributes, 'id'> {}

class WebsiteActions extends Model<WebsiteActionsAttributes, WebsiteActionsCreationAttributes> implements WebsiteActionsAttributes {
    declare id: number;
    declare stream_banner_enabled: boolean;
    declare registration_enabled: boolean;
}

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
