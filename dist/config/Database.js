"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class DatabaseConfig {
    static getInstance() {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new sequelize_1.Sequelize({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                username: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || 'password',
                database: process.env.DB_NAME || 'maxhub_erp',
                dialect: 'mysql',
                logging: process.env.NODE_ENV === 'production'
                    ? false
                    : process.env.LOG_SQL === 'true'
                        ? console.log
                        : false,
                pool: {
                    max: parseInt(process.env.DB_POOL_MAX || '10'),
                    min: parseInt(process.env.DB_POOL_MIN || '2'),
                    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
                },
                timezone: process.env.DB_TIMEZONE || '+00:00',
                define: {
                    timestamps: true,
                    paranoid: true,
                    underscored: true,
                },
            });
        }
        return DatabaseConfig.instance;
    }
    static async testConnection() {
        try {
            const sequelize = DatabaseConfig.getInstance();
            await sequelize.authenticate();
            console.log('✅ Database connection successful');
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    static async closeConnection() {
        const sequelize = DatabaseConfig.getInstance();
        if (sequelize) {
            await sequelize.close();
            console.log('✅ Database connection closed');
        }
    }
    static async syncDatabase(force = false) {
        try {
            const sequelize = DatabaseConfig.getInstance();
            await sequelize.sync({ alter: !force, force });
            console.log('✅ Database schema synced');
        }
        catch (error) {
            console.error('❌ Database sync failed:', error);
            throw error;
        }
    }
}
exports.default = DatabaseConfig;
//# sourceMappingURL=Database.js.map