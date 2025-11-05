import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Sequelize.js';

class Banlist extends Model { }

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