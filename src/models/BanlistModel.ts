import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Sequelize';

interface BanlistAttributes {
    id: number;
    label: string;
    release_date: Date;
    is_active: boolean;
    description: string;
    is_event_banlist: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface BanlistCreationAttributes extends Optional<BanlistAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Banlist extends Model<BanlistAttributes, BanlistCreationAttributes> implements BanlistAttributes {
    declare id: number;
    declare label: string;
    declare release_date: Date;
    declare is_active: boolean;
    declare description: string;
     declare is_event_banlist: boolean;
    declare created_at?: Date;
    declare updated_at?: Date;
}

Banlist.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        label: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        release_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_event_banlist: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
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
    },
    {
        sequelize,
        modelName: 'Banlist',
        tableName: 'banlist',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Banlist;
