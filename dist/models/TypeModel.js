"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Sequelize_1 = __importDefault(require("../config/Sequelize"));
/**
 * Type model representing a card type
 */
class Type extends sequelize_1.Model {
}
Type.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    label: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        unique: true
    }
}, {
    sequelize: Sequelize_1.default,
    modelName: 'Type',
    tableName: 'type',
    timestamps: false
});
exports.default = Type;
//# sourceMappingURL=TypeModel.js.map