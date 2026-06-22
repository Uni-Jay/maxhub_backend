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
const uuid_1 = require("uuid");
const User_model_1 = require("../models/User.model");
const Staff_model_1 = require("../models/Staff.model");
const Department_model_1 = require("../models/Department.model");
const PERSONAS = {
    'superadmin@maxhub.com': { position: 'CEO', employeeId: 'DEMO-SUPERADMIN' },
    'admin@maxhub.com': { position: 'Head of Admin', employeeId: 'DEMO-ADMIN' },
    'hr@maxhub.com': { position: 'HR Manager', employeeId: 'DEMO-HR' },
    'hod@maxhub.com': { position: 'Head of Department', employeeId: 'DEMO-HOD' },
    'staff@maxhub.com': { position: 'General Staff', employeeId: 'DEMO-STAFF' },
    'accountant@maxhub.com': { position: 'Accountant', employeeId: 'DEMO-ACCOUNTANT' },
    'instructor@maxhub.com': { position: 'Instructor', employeeId: 'DEMO-INSTRUCTOR' },
    'receptionist@maxhub.com': { position: 'Receptionist', employeeId: 'DEMO-RECEPTIONIST' },
};
async function main() {
    const sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    });
    User_model_1.User.initModel(sequelize);
    Staff_model_1.Staff.initModel(sequelize);
    Department_model_1.Department.initModel(sequelize);
    const department = await Department_model_1.Department.findOne({ order: [['id', 'ASC']] });
    if (!department) {
        console.log('No department exists yet — run seed-departments.ts first. Aborting.');
        await sequelize.close();
        return;
    }
    let created = 0;
    let skipped = 0;
    for (const [email, persona] of Object.entries(PERSONAS)) {
        const user = await User_model_1.User.findOne({ where: { email } });
        if (!user) {
            console.log(`⏭️  No User found for ${email}, skipping`);
            continue;
        }
        const existing = await Staff_model_1.Staff.findOne({ where: { userId: user.id } });
        if (existing) {
            skipped++;
            continue;
        }
        await Staff_model_1.Staff.create({
            uuid: (0, uuid_1.v4)(),
            userId: user.id,
            employeeId: persona.employeeId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: '+2348000000000',
            dateOfBirth: new Date('1990-01-01'),
            departmentId: department.id,
            joiningDate: new Date(),
            status: 'Active',
            position: persona.position,
        });
        created++;
        console.log(`✅ Created Staff for ${email} (position: ${persona.position})`);
    }
    console.log(`\nDone. ${created} created, ${skipped} already had a Staff row.`);
    await sequelize.close();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=backfill-demo-staff.js.map