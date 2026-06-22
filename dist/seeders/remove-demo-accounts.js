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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const sequelize_1 = require("sequelize");
const User_model_1 = require("../models/User.model");
const Staff_model_1 = require("../models/Staff.model");
const UserRole_model_1 = require("../models/UserRole.model");
const DEMO_EMAILS = [
    'superadmin@maxhub.com',
    'admin@maxhub.com',
    'hr@maxhub.com',
    'hod@maxhub.com',
    'staff@maxhub.com',
    'accountant@maxhub.com',
    'instructor@maxhub.com',
    'receptionist@maxhub.com',
    'student@maxhub.com',
];
async function main() {
    const sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    });
    User_model_1.User.initModel(sequelize);
    Staff_model_1.Staff.initModel(sequelize);
    UserRole_model_1.UserRole.initModel(sequelize);
    for (const email of DEMO_EMAILS) {
        const user = await User_model_1.User.findOne({ where: { email } });
        if (!user) {
            console.log(`⏭️  No account found for ${email}, skipping`);
            continue;
        }
        const staff = await Staff_model_1.Staff.findOne({ where: { userId: user.id } });
        if (staff)
            await staff.destroy();
        const roles = await UserRole_model_1.UserRole.findAll({ where: { userId: user.id } });
        if (roles.length)
            await UserRole_model_1.UserRole.destroy({ where: { userId: user.id } });
        await user.destroy();
        console.log(`✅ Removed ${email} (user#${user.id}${staff ? `, staff#${staff.id}` : ''}, ${roles.length} role assignment(s) cleared)`);
    }
    console.log('\nDone.');
    await sequelize.close();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=remove-demo-accounts.js.map