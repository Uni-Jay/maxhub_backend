"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_ThemeConfig extends sequelize_1.Model {
}
PHASE25_ThemeConfig.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    themeName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    isDarkMode: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    fontFamily: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'Inter, system-ui',
    },
    fontSize: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 14,
    },
    colorScheme: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'JSON: { primary, secondary, accent, background, text }',
    },
    layoutPreferences: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'JSON: { sidebarCollapsed, compactMode }',
    },
    componentStyles: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Custom styles for components',
    },
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff',
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'phase25_theme_config',
    timestamps: true,
    indexes: [
        {
            fields: ['organizationId', 'isDefault'],
        },
    ],
});
exports.default = PHASE25_ThemeConfig;
//# sourceMappingURL=PHASE-25-ThemeConfig.model.js.map