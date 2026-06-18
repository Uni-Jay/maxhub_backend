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
exports.DatabaseConfig = void 0;
const sequelize_1 = require("sequelize");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const SSL_OPTIONS = {
    require: true,
    rejectUnauthorized: false,
};
const logging = process.env.NODE_ENV === 'production'
    ? false
    : process.env.LOG_SQL === 'true'
        ? console.log
        : false;
const POOL = {
    max: parseInt(process.env.DB_POOL_MAX || '5'),
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
};
const DEFINE = {
    timestamps: true,
    paranoid: true,
    underscored: true,
};
const RETRY = {
    max: 3,
    match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /ESOCKETTIMEDOUT/,
        /EPIPE/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
    ],
};
class DatabaseConfig {
    static getInstance() {
        if (!DatabaseConfig.instance) {
            const url = process.env.DATABASE_URL;
            if (url) {
                DatabaseConfig.instance = new sequelize_1.Sequelize(url, {
                    dialect: 'postgres',
                    logging,
                    dialectOptions: { ssl: SSL_OPTIONS },
                    pool: POOL,
                    define: DEFINE,
                    retry: RETRY,
                });
            }
            else {
                DatabaseConfig.instance = new sequelize_1.Sequelize({
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '5432'),
                    username: process.env.DB_USER || 'postgres',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_NAME || 'postgres',
                    dialect: 'postgres',
                    logging,
                    dialectOptions: { ssl: SSL_OPTIONS },
                    pool: POOL,
                    define: DEFINE,
                    retry: RETRY,
                });
            }
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
            await sequelize.sync({ alter: true });
            console.log('✅ Database schema synced');
        }
        catch (error) {
            console.error('❌ Database sync failed:', error);
            throw error;
        }
    }
}
exports.DatabaseConfig = DatabaseConfig;
exports.default = DatabaseConfig.getInstance();
//# sourceMappingURL=Database.js.map