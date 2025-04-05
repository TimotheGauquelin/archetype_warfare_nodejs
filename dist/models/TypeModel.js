import { DataTypes, Model } from "sequelize";
import sequelize from '../config/Sequelize.js';
/**
 * Type model representing archetype types in the game
 * @class Type
 * @extends {Model}
 */
class Type extends Model {
    /**
     * Checks if the type is used by archetypes
     * @returns {Promise<boolean>} True if the type is used
     */
    async isUsed() {
        const archetypeCount = await this.countArchetypes();
        return archetypeCount > 0;
    }
    /**
     * Gets the number of archetypes associated with this type
     * @returns {Promise<number>} The number of archetypes
     */
    async getArchetypeCount() {
        return await this.countArchetypes();
    }
    /**
     * Creates a new type with validation
     * @static
     * @param {Object} data - The type data
     * @param {string} data.label - The type label
     * @returns {Promise<Type>} The created type
     * @throws {Error} If the label is invalid
     */
    static async createType(data) {
        if (!data.label || data.label.trim().length === 0) {
            throw new Error('Type label is required');
        }
        if (data.label.length > 50) {
            throw new Error('Type label must not exceed 50 characters');
        }
        return await this.create(data);
    }
    /**
     * Updates a type with validation
     * @param {Object} data - The data to update
     * @returns {Promise<Type>} The updated type
     * @throws {Error} If the data is invalid
     */
    async updateType(data) {
        if (data.label) {
            if (data.label.trim().length === 0) {
                throw new Error('Type label cannot be empty');
            }
            if (data.label.length > 50) {
                throw new Error('Type label must not exceed 50 characters');
            }
        }
        return await this.update(data);
    }
}
Type.init({
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        comment: 'Unique identifier of the type'
    },
    label: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: {
                msg: 'Type label cannot be empty'
            },
            len: {
                args: [1, 50],
                msg: 'Type label must be between 1 and 50 characters'
            }
        },
        comment: 'Name of the type (e.g., Fusion, Synchro, etc.)'
    }
}, {
    sequelize,
    tableName: 'type',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['label']
        }
    ],
    hooks: {
        beforeCreate: async (type) => {
            if (type.label) {
                type.label = type.label.trim();
            }
        },
        beforeUpdate: async (type) => {
            if (type.changed('label')) {
                type.label = type.label.trim();
            }
        },
        beforeDestroy: async (type) => {
            const isUsed = await type.isUsed();
            if (isUsed) {
                throw new Error('Cannot delete a type that is used by archetypes');
            }
        }
    }
});
export default Type;
