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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const sequelize_1 = require("sequelize");
const User_model_1 = require("../models/User.model");
const Staff_model_1 = require("../models/Staff.model");
const Department_model_1 = require("../models/Department.model");
const PasswordService_1 = __importDefault(require("../services/PasswordService"));
const CommunicationService_1 = require("../services/CommunicationService");
async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: ts-node reset-and-email-temp-password.ts <email>');
        process.exit(1);
    }
    const dbUrl = process.env.DATABASE_URL;
    const SSL_OPTIONS = { require: true, rejectUnauthorized: false };
    const sequelize = new sequelize_1.Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
        dialectOptions: { ssl: SSL_OPTIONS },
    });
    await sequelize.authenticate();
    User_model_1.User.initModel(sequelize);
    Staff_model_1.Staff.initModel(sequelize);
    Department_model_1.Department.initModel(sequelize);
    const user = await User_model_1.User.findOne({ where: { email } });
    if (!user) {
        console.error(`No user found with email ${email}`);
        process.exit(1);
    }
    const staff = await Staff_model_1.Staff.findOne({ where: { email } });
    const dept = staff && staff.departmentId ? await Department_model_1.Department.findByPk(staff.departmentId, { attributes: ['name'] }) : null;
    const temporaryPassword = PasswordService_1.default.generateRandomPassword(12);
    const passwordHash = await PasswordService_1.default.hashPassword(temporaryPassword);
    await user.update({ passwordHash });
    console.log(`✅  Password reset for ${email}`);
    console.log(`   New temp password: ${temporaryPassword}`);
    const sent = await (0, CommunicationService_1.sendWelcomeEmail)({
        to: email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: staff?.employeeId || '—',
        temporaryPassword,
        position: staff?.position || undefined,
        department: dept?.name || undefined,
    });
    console.log(sent ? '✅  Welcome email sent' : '❌  Welcome email failed to send (check SMTP config)');
    await sequelize.close();
    process.exit(sent ? 0 : 1);
}
main().catch((err) => {
    console.error('\n❌  Failed:', err);
    process.exit(1);
});
//# sourceMappingURL=reset-and-email-temp-password.js.map