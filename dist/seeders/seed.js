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
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const PermissionCodes_1 = require("../config/PermissionCodes");
const RolesConfig_1 = require("../config/RolesConfig");
const User_model_1 = require("../models/User.model");
const Role_model_1 = require("../models/Role.model");
const Permission_model_1 = require("../models/Permission.model");
const UserRole_model_1 = require("../models/UserRole.model");
const RolePermission_model_1 = require("../models/RolePermission.model");
const UserPermission_model_1 = require("../models/UserPermission.model");
const Session_model_1 = require("../models/Session.model");
const OTPVerification_model_1 = require("../models/OTPVerification.model");
const Department_model_1 = require("../models/Department.model");
const Designation_model_1 = require("../models/Designation.model");
const Location_model_1 = require("../models/Location.model");
const Staff_model_1 = require("../models/Staff.model");
const StaffDepartment_model_1 = require("../models/StaffDepartment.model");
const StaffQualification_model_1 = require("../models/StaffQualification.model");
const StaffSkill_model_1 = require("../models/StaffSkill.model");
const StaffDocument_model_1 = require("../models/StaffDocument.model");
const Shift_model_1 = require("../models/Shift.model");
const Attendance_model_1 = require("../models/Attendance.model");
const Timesheet_model_1 = require("../models/Timesheet.model");
const AttendanceLog_model_1 = require("../models/AttendanceLog.model");
const LeaveType_model_1 = require("../models/LeaveType.model");
const LeaveBalance_model_1 = require("../models/LeaveBalance.model");
const LeaveRequest_model_1 = require("../models/LeaveRequest.model");
const Project_model_1 = require("../models/Project.model");
const Milestone_model_1 = require("../models/Milestone.model");
const Task_model_1 = require("../models/Task.model");
const Contact_model_1 = require("../models/Contact.model");
const Opportunity_model_1 = require("../models/Opportunity.model");
const SalaryStructure_model_1 = require("../models/SalaryStructure.model");
const PayrollPeriod_model_1 = require("../models/PayrollPeriod.model");
const EmployeeSalary_model_1 = require("../models/EmployeeSalary.model");
const Course_model_1 = require("../models/Course.model");
const CourseModule_model_1 = require("../models/CourseModule.model");
const CourseContent_model_1 = require("../models/CourseContent.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const Exam_model_1 = require("../models/Exam.model");
const Question_model_1 = require("../models/Question.model");
const ExamResult_model_1 = require("../models/ExamResult.model");
const Certificate_model_1 = require("../models/Certificate.model");
const Assignment_model_1 = require("../models/Assignment.model");
const Submission_model_1 = require("../models/Submission.model");
const JobPosting_model_1 = require("../models/JobPosting.model");
const JobSyncLog_model_1 = require("../models/JobSyncLog.model");
const WeeklyReport_model_1 = require("../models/WeeklyReport.model");
const CalendarEvent_model_1 = require("../models/CalendarEvent.model");
const FileRecord_model_1 = require("../models/FileRecord.model");
const Customer_model_1 = require("../models/Customer.model");
const OrderTracking_model_1 = require("../models/OrderTracking.model");
const JobApplication_model_1 = require("../models/JobApplication.model");
const Interview_model_1 = require("../models/Interview.model");
const JobOffer_model_1 = require("../models/JobOffer.model");
const OnboardingTask_model_1 = require("../models/OnboardingTask.model");
const Conversation_model_1 = require("../models/Conversation.model");
const ConversationParticipant_model_1 = require("../models/ConversationParticipant.model");
const Message_model_1 = require("../models/Message.model");
const MessageRead_model_1 = require("../models/MessageRead.model");
const Notification_model_1 = require("../models/Notification.model");
const Account_model_1 = require("../models/Account.model");
const Activity_model_1 = require("../models/Activity.model");
const Quote_model_1 = require("../models/Quote.model");
const Order_model_1 = require("../models/Order.model");
const SalaryComponent_model_1 = require("../models/SalaryComponent.model");
const ChartOfAccounts_model_1 = require("../models/ChartOfAccounts.model");
const JournalEntry_model_1 = require("../models/JournalEntry.model");
const Invoice_model_1 = require("../models/Invoice.model");
const Payment_model_1 = require("../models/Payment.model");
const InventoryCategory_model_1 = require("../models/InventoryCategory.model");
const InventoryItem_model_1 = require("../models/InventoryItem.model");
const Warehouse_model_1 = require("../models/Warehouse.model");
const WarehouseStock_model_1 = require("../models/WarehouseStock.model");
const StockTransaction_model_1 = require("../models/StockTransaction.model");
const Supplier_model_1 = require("../models/Supplier.model");
const PurchaseOrder_model_1 = require("../models/PurchaseOrder.model");
const Budget_model_1 = require("../models/Budget.model");
const Appraisal_model_1 = require("../models/Appraisal.model");
const Goal_model_1 = require("../models/Goal.model");
const Feedback_model_1 = require("../models/Feedback.model");
const EmployeeDocument_model_1 = require("../models/EmployeeDocument.model");
const HolidayCalendar_model_1 = require("../models/HolidayCalendar.model");
const BenefitType_model_1 = require("../models/BenefitType.model");
const TrainingProgram_model_1 = require("../models/TrainingProgram.model");
const TrainingAttendance_model_1 = require("../models/TrainingAttendance.model");
const Expense_model_1 = require("../models/Expense.model");
const AssetType_model_1 = require("../models/AssetType.model");
const Asset_model_1 = require("../models/Asset.model");
const ProjectNote_model_1 = require("../models/ProjectNote.model");
const Survey_model_1 = require("../models/Survey.model");
const Complaint_model_1 = require("../models/Complaint.model");
const SystemSetting_model_1 = require("../models/SystemSetting.model");
const AuditLog_model_1 = require("../models/AuditLog.model");
const StaffQuery_model_1 = require("../models/StaffQuery.model");
const StaffQueryReply_model_1 = require("../models/StaffQueryReply.model");
const Client_model_1 = require("../models/Client.model");
const ClientDocument_model_1 = require("../models/ClientDocument.model");
const ClientNote_model_1 = require("../models/ClientNote.model");
const MessageTemplate_model_1 = require("../models/MessageTemplate.model");
const CommunicationLog_model_1 = require("../models/CommunicationLog.model");
const Company_model_1 = require("../models/Company.model");
const Program_model_1 = require("../models/Program.model");
const StudentProfile_model_1 = require("../models/StudentProfile.model");
const StudentEnrollment_model_1 = require("../models/StudentEnrollment.model");
const StudentResult_model_1 = require("../models/StudentResult.model");
const StudentAttendance_model_1 = require("../models/StudentAttendance.model");
const ClassSchedule_model_1 = require("../models/ClassSchedule.model");
const Branch_model_1 = require("../models/Branch.model");
const Unit_model_1 = require("../models/Unit.model");
const Meeting_model_1 = require("../models/Meeting.model");
const MeetingParticipant_model_1 = require("../models/MeetingParticipant.model");
const Call_model_1 = require("../models/Call.model");
const Module_model_1 = require("../models/Module.model");
const UserModulePermission_model_1 = require("../models/UserModulePermission.model");
const TwoFactorAuth_model_1 = require("../models/TwoFactorAuth.model");
const PasswordReset_model_1 = require("../models/PasswordReset.model");
const DeviceLog_model_1 = require("../models/DeviceLog.model");
const AIConversation_model_1 = require("../modules/ai/models/AIConversation.model");
const AIMessage_model_1 = require("../modules/ai/models/AIMessage.model");
const AIMeetingSummary_model_1 = require("../modules/ai/models/AIMeetingSummary.model");
const AIReminder_model_1 = require("../modules/ai/models/AIReminder.model");
const Associations_1 = require("../models/Associations");
function parsePermissionCode(code) {
    const parts = code.split('.');
    const scope = parts[parts.length - 1];
    const action = parts[parts.length - 2];
    const module = parts[0];
    const resource = parts.slice(1, parts.length - 2).join('.');
    return { module, resource, action, scope };
}
function toTitleCase(str) {
    return str
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
function makePermissionName(code) {
    const { module, resource, action, scope } = parsePermissionCode(code);
    const scopeLabel = scope === 'own_department' ? 'Own Dept' :
        scope === 'own_warehouse' ? 'Own Warehouse' :
            scope === 'own' ? 'Own' : 'All';
    return `${toTitleCase(module)} › ${toTitleCase(resource)} › ${toTitleCase(action)} [${scopeLabel}]`;
}
async function retryFindOrCreate(fn, maxAttempts = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            const isTransactionErr = err?.message?.includes('transaction') ||
                err?.parent?.errno === 1213 || err?.original?.errno === 1213;
            if (isTransactionErr && attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
            else {
                throw err;
            }
        }
    }
    throw new Error('retryFindOrCreate: max attempts exceeded');
}
async function main() {
    console.log('\n🚀  MaxHub ERP — Database Migration & Seeder\n');
    const dbUrl = process.env.DATABASE_URL;
    console.log(`📡  Host : ${dbUrl ? '(DATABASE_URL)' : process.env.DB_HOST}`);
    console.log(`🗄️   DB   : ${process.env.DB_NAME ?? 'postgres'}`);
    console.log(`👤  User : ${process.env.DB_USER ?? 'postgres'}\n`);
    const SSL_OPTIONS = { require: true, rejectUnauthorized: false };
    const sequelize = dbUrl
        ? new sequelize_1.Sequelize(dbUrl, {
            dialect: 'postgres',
            logging: false,
            pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
            dialectOptions: { ssl: SSL_OPTIONS },
        })
        : new sequelize_1.Sequelize({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            dialect: 'postgres',
            logging: false,
            pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
            dialectOptions: { ssl: SSL_OPTIONS },
        });
    try {
        await sequelize.authenticate();
        console.log('✅  Database connection successful\n');
    }
    catch (err) {
        console.error('❌  Cannot connect to database:', err);
        process.exit(1);
    }
    console.log('📦  Initializing models...');
    User_model_1.User.initModel(sequelize);
    Role_model_1.Role.initModel(sequelize);
    Permission_model_1.Permission.initModel(sequelize);
    UserRole_model_1.UserRole.initModel(sequelize);
    RolePermission_model_1.RolePermission.initModel(sequelize);
    UserPermission_model_1.UserPermission.initModel(sequelize);
    Session_model_1.Session.initModel(sequelize);
    OTPVerification_model_1.OTPVerification.initModel(sequelize);
    Department_model_1.Department.initModel(sequelize);
    Designation_model_1.Designation.initModel(sequelize);
    Location_model_1.Location.initModel(sequelize);
    Staff_model_1.Staff.initModel(sequelize);
    StaffDepartment_model_1.StaffDepartment.initModel(sequelize);
    StaffQualification_model_1.StaffQualification.initModel(sequelize);
    StaffSkill_model_1.StaffSkill.initModel(sequelize);
    StaffDocument_model_1.StaffDocument.initModel(sequelize);
    Shift_model_1.Shift.initModel(sequelize);
    Attendance_model_1.Attendance.initModel(sequelize);
    Timesheet_model_1.Timesheet.initModel(sequelize);
    AttendanceLog_model_1.AttendanceLog.initModel(sequelize);
    LeaveType_model_1.LeaveType.initModel(sequelize);
    LeaveBalance_model_1.LeaveBalance.initModel(sequelize);
    LeaveRequest_model_1.LeaveRequest.initModel(sequelize);
    Project_model_1.Project.initModel(sequelize);
    Milestone_model_1.Milestone.initModel(sequelize);
    Task_model_1.Task.initModel(sequelize);
    Contact_model_1.Contact.initModel(sequelize);
    Opportunity_model_1.Opportunity.initModel(sequelize);
    SalaryStructure_model_1.SalaryStructure.initModel(sequelize);
    PayrollPeriod_model_1.PayrollPeriod.initModel(sequelize);
    EmployeeSalary_model_1.EmployeeSalary.initModel(sequelize);
    Course_model_1.Course.initModel(sequelize);
    CourseModule_model_1.CourseModule.initModel(sequelize);
    CourseContent_model_1.CourseContent.initModel(sequelize);
    Enrollment_model_1.Enrollment.initModel(sequelize);
    Exam_model_1.Exam.initModel(sequelize);
    Question_model_1.Question.initModel(sequelize);
    ExamResult_model_1.ExamResult.initModel(sequelize);
    Certificate_model_1.Certificate.initModel(sequelize);
    Assignment_model_1.Assignment.initModel(sequelize);
    Submission_model_1.Submission.initModel(sequelize);
    JobPosting_model_1.JobPosting.initModel(sequelize);
    JobSyncLog_model_1.JobSyncLog.initModel(sequelize);
    WeeklyReport_model_1.WeeklyReport.initModel(sequelize);
    CalendarEvent_model_1.CalendarEvent.initModel(sequelize);
    FileRecord_model_1.FileRecord.initModel(sequelize);
    Customer_model_1.Customer.initModel(sequelize);
    OrderTracking_model_1.OrderTracking.initModel(sequelize);
    JobApplication_model_1.JobApplication.initModel(sequelize);
    Interview_model_1.Interview.initModel(sequelize);
    JobOffer_model_1.JobOffer.initModel(sequelize);
    OnboardingTask_model_1.OnboardingTask.initModel(sequelize);
    Conversation_model_1.Conversation.initModel(sequelize);
    ConversationParticipant_model_1.ConversationParticipant.initModel(sequelize);
    Message_model_1.Message.initModel(sequelize);
    MessageRead_model_1.MessageRead.initModel(sequelize);
    Notification_model_1.Notification.initModel(sequelize);
    Account_model_1.Account.initModel(sequelize);
    Activity_model_1.Activity.initModel(sequelize);
    Quote_model_1.Quote.initModel(sequelize);
    Order_model_1.Order.initModel(sequelize);
    SalaryComponent_model_1.SalaryComponent.initModel(sequelize);
    ChartOfAccounts_model_1.ChartOfAccounts.initModel(sequelize);
    JournalEntry_model_1.JournalEntry.initModel(sequelize);
    Invoice_model_1.Invoice.initModel(sequelize);
    Payment_model_1.Payment.initModel(sequelize);
    InventoryCategory_model_1.InventoryCategory.initModel(sequelize);
    InventoryItem_model_1.InventoryItem.initModel(sequelize);
    Warehouse_model_1.Warehouse.initModel(sequelize);
    WarehouseStock_model_1.WarehouseStock.initModel(sequelize);
    StockTransaction_model_1.StockTransaction.initModel(sequelize);
    Supplier_model_1.Supplier.initModel(sequelize);
    PurchaseOrder_model_1.PurchaseOrder.initModel(sequelize);
    Budget_model_1.Budget.initModel(sequelize);
    Appraisal_model_1.Appraisal.initModel(sequelize);
    Goal_model_1.Goal.initModel(sequelize);
    Feedback_model_1.Feedback.initModel(sequelize);
    EmployeeDocument_model_1.EmployeeDocument.initModel(sequelize);
    HolidayCalendar_model_1.HolidayCalendar.initModel(sequelize);
    BenefitType_model_1.BenefitType.initModel(sequelize);
    TrainingProgram_model_1.TrainingProgram.initModel(sequelize);
    TrainingAttendance_model_1.TrainingAttendance.initModel(sequelize);
    Expense_model_1.Expense.initModel(sequelize);
    AssetType_model_1.AssetType.initModel(sequelize);
    Asset_model_1.Asset.initModel(sequelize);
    ProjectNote_model_1.ProjectNote.initModel(sequelize);
    Survey_model_1.Survey.initModel(sequelize);
    Complaint_model_1.Complaint.initModel(sequelize);
    SystemSetting_model_1.SystemSetting.initModel(sequelize);
    AuditLog_model_1.AuditLog.initModel(sequelize);
    StaffQuery_model_1.StaffQuery.initModel(sequelize);
    StaffQueryReply_model_1.StaffQueryReply.initModel(sequelize);
    Client_model_1.Client.initModel(sequelize);
    ClientDocument_model_1.ClientDocument.initModel(sequelize);
    ClientNote_model_1.ClientNote.initModel(sequelize);
    MessageTemplate_model_1.MessageTemplate.initModel(sequelize);
    CommunicationLog_model_1.CommunicationLog.initModel(sequelize);
    Company_model_1.Company.initModel(sequelize);
    Program_model_1.Program.initModel(sequelize);
    StudentProfile_model_1.StudentProfile.initModel(sequelize);
    StudentEnrollment_model_1.StudentEnrollment.initModel(sequelize);
    StudentResult_model_1.StudentResult.initModel(sequelize);
    StudentAttendance_model_1.StudentAttendance.initModel(sequelize);
    ClassSchedule_model_1.ClassSchedule.initModel(sequelize);
    Branch_model_1.Branch.initModel(sequelize);
    Unit_model_1.Unit.initModel(sequelize);
    Meeting_model_1.Meeting.initModel(sequelize);
    MeetingParticipant_model_1.MeetingParticipant.initModel(sequelize);
    Call_model_1.Call.initModel(sequelize);
    Module_model_1.AppModule.initModel(sequelize);
    UserModulePermission_model_1.UserModulePermission.initModel(sequelize);
    TwoFactorAuth_model_1.TwoFactorAuth.initModel(sequelize);
    PasswordReset_model_1.PasswordReset.initModel(sequelize);
    DeviceLog_model_1.DeviceLog.initModel(sequelize);
    AIConversation_model_1.AIConversation.initModel(sequelize);
    AIMessage_model_1.AIMessage.initModel(sequelize);
    AIMeetingSummary_model_1.AIMeetingSummary.initModel(sequelize);
    AIReminder_model_1.AIReminder.initModel(sequelize);
    Associations_1.AssociationManager.initializeAssociations(sequelize);
    console.log('✅  Models initialized\n');
    console.log('🔄  Syncing database tables (force: drop + recreate)...');
    console.log('    This may take a moment — creating/updating all tables...');
    let syncAttempt = 0;
    while (true) {
        try {
            await sequelize.sync({ force: true });
            console.log('✅  All tables synced\n');
            break;
        }
        catch (err) {
            const isDeadlock = err?.parent?.errno === 1213 || err?.original?.errno === 1213;
            if (isDeadlock && syncAttempt < 5) {
                syncAttempt++;
                console.warn(`   ⚠️  Deadlock on attempt ${syncAttempt}, retrying in 5s...`);
                await new Promise((r) => setTimeout(r, 5000));
            }
            else {
                console.error('❌  Table sync failed:', err);
                process.exit(1);
            }
        }
    }
    console.log('🔐  Seeding permissions...');
    const allCodes = Object.values(PermissionCodes_1.PermissionCode);
    const permRows = allCodes.map((code) => {
        const { module, resource, action, scope } = parsePermissionCode(code);
        return {
            code,
            name: makePermissionName(code),
            description: `${toTitleCase(action)} ${toTitleCase(resource)} (${scope})`,
            module,
            resource,
            action,
            scope,
            isActive: true,
        };
    });
    await Permission_model_1.Permission.bulkCreate(permRows, { ignoreDuplicates: true });
    console.log(`✅  Permissions: ${allCodes.length} total (new ones inserted, duplicates ignored)\n`);
    console.log('👥  Seeding roles...');
    const ROLE_NAMES = {
        [RolesConfig_1.RoleCode.SUPERADMIN]: 'Super Administrator',
        [RolesConfig_1.RoleCode.ADMIN]: 'Administrator',
        [RolesConfig_1.RoleCode.HR]: 'Human Resources',
        [RolesConfig_1.RoleCode.HOD]: 'Head of Department',
        [RolesConfig_1.RoleCode.STAFF]: 'Staff',
        [RolesConfig_1.RoleCode.STUDENT]: 'Student',
    };
    const roleMap = new Map();
    for (const roleCode of Object.values(RolesConfig_1.RoleCode)) {
        const [role, created] = await retryFindOrCreate(() => Role_model_1.Role.findOrCreate({
            where: { code: roleCode },
            defaults: {
                code: roleCode,
                name: ROLE_NAMES[roleCode],
                description: RolesConfig_1.ROLE_DESCRIPTIONS[roleCode],
                isSystemRole: true,
                isActive: true,
            },
        }));
        roleMap.set(roleCode, role.id);
        console.log(`   ${created ? '✨ Created' : '⏭️  Exists '} → ${ROLE_NAMES[roleCode]} (${roleCode})`);
    }
    console.log('');
    console.log('🔗  Assigning permissions to roles...');
    const allPermissions = await Permission_model_1.Permission.findAll({ attributes: ['id', 'code'] });
    const permMap = new Map();
    for (const p of allPermissions) {
        permMap.set(p.code, p.id);
    }
    const rpRows = [];
    for (const [roleCode, permCodes] of Object.entries(RolesConfig_1.ROLE_PERMISSIONS)) {
        const roleId = roleMap.get(roleCode);
        if (!roleId)
            continue;
        for (const permCode of permCodes) {
            const permId = permMap.get(permCode);
            if (!permId) {
                console.warn(`   ⚠️  Permission not found in DB: ${permCode}`);
                continue;
            }
            rpRows.push({ roleId, permissionId: permId });
        }
    }
    const CHUNK = 100;
    let rpCreated = 0;
    for (let i = 0; i < rpRows.length; i += CHUNK) {
        const chunk = rpRows.slice(i, i + CHUNK);
        const result = await RolePermission_model_1.RolePermission.bulkCreate(chunk, { ignoreDuplicates: true });
        rpCreated += result.length;
    }
    console.log(`✅  Role-permissions: ${rpRows.length} total pairs processed (${rpCreated} inserted)\n`);
    console.log('👤  Seeding default Super Admin user...');
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@maxhub.com';
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'MaxHub@Admin2024!';
    const superAdminHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
    const [superAdmin, userCreated] = await retryFindOrCreate(() => User_model_1.User.findOrCreate({
        where: { email: SUPER_ADMIN_EMAIL },
        defaults: {
            uuid: (0, uuid_1.v4)(),
            firstName: 'Super',
            lastName: 'Admin',
            email: SUPER_ADMIN_EMAIL,
            passwordHash: superAdminHash,
            status: 'Active',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            loginAttempts: 0,
        },
    }));
    if (userCreated) {
        const superAdminRoleId = roleMap.get(RolesConfig_1.RoleCode.SUPERADMIN);
        if (superAdminRoleId) {
            await retryFindOrCreate(() => UserRole_model_1.UserRole.findOrCreate({
                where: { userId: superAdmin.id, roleId: superAdminRoleId },
                defaults: { userId: superAdmin.id, roleId: superAdminRoleId, assignedAt: new Date() },
            }));
        }
        console.log(`✅  Super Admin created`);
        console.log(`    Email   : ${SUPER_ADMIN_EMAIL}`);
        console.log(`    Password: ${SUPER_ADMIN_PASSWORD}`);
    }
    else {
        console.log(`⏭️  Super Admin already exists (${SUPER_ADMIN_EMAIL})`);
    }
    console.log('\n👥  Seeding role demo users...');
    const DEMO_PASSWORD = 'Demo@12345!';
    const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const demoUsers = [
        { email: 'admin@maxhub.com', firstName: 'Admin', lastName: 'Head', role: RolesConfig_1.RoleCode.ADMIN },
        { email: 'hr@maxhub.com', firstName: 'Human', lastName: 'Resources', role: RolesConfig_1.RoleCode.HR },
        { email: 'hod@maxhub.com', firstName: 'Department', lastName: 'Head', role: RolesConfig_1.RoleCode.HOD },
        { email: 'staff@maxhub.com', firstName: 'Regular', lastName: 'Staff', role: RolesConfig_1.RoleCode.STAFF },
        { email: 'accountant@maxhub.com', firstName: 'Finance', lastName: 'Accountant', role: RolesConfig_1.RoleCode.STAFF },
        { email: 'instructor@maxhub.com', firstName: 'Course', lastName: 'Instructor', role: RolesConfig_1.RoleCode.STAFF },
        { email: 'receptionist@maxhub.com', firstName: 'Front', lastName: 'Desk', role: RolesConfig_1.RoleCode.STAFF },
    ];
    let demoCreated = 0;
    for (const demo of demoUsers) {
        const [demoUser, created] = await retryFindOrCreate(() => User_model_1.User.findOrCreate({
            where: { email: demo.email },
            defaults: {
                uuid: (0, uuid_1.v4)(),
                firstName: demo.firstName,
                lastName: demo.lastName,
                email: demo.email,
                passwordHash: demoPasswordHash,
                status: 'Active',
                emailVerified: true,
                emailVerifiedAt: new Date(),
                loginAttempts: 0,
            },
        }));
        if (!created) {
            await demoUser.update({ passwordHash: demoPasswordHash, loginAttempts: 0, lockedUntil: null });
        }
        const roleId = roleMap.get(demo.role);
        if (roleId) {
            await retryFindOrCreate(() => UserRole_model_1.UserRole.findOrCreate({
                where: { userId: demoUser.id, roleId },
                defaults: { userId: demoUser.id, roleId, assignedAt: new Date() },
            }));
        }
        if (created) {
            demoCreated++;
            console.log(`   ✨ Created → ${demo.email} [${demo.role}]`);
        }
        else {
            console.log(`   ✅ Updated → ${demo.email} [${demo.role}] (password reset to Demo@12345!)`);
        }
    }
    console.log(`\n✅  Demo users: ${demoCreated} created\n`);
    console.log('   All demo accounts use password: Demo@12345!');
    console.log('   ┌─────────────────────────────────────────┬────────────────┬─────────────────────┐');
    console.log('   │ Email                                   │ Role           │ Position            │');
    console.log('   ├─────────────────────────────────────────┼────────────────┼─────────────────────┤');
    console.log(`   │ ${'superadmin@maxhub.com'.padEnd(39)} │ ${'superadmin'.padEnd(14)} │ CEO                 │`);
    console.log(`   │ ${'admin@maxhub.com'.padEnd(39)} │ ${'admin'.padEnd(14)} │ Head of Admin       │`);
    console.log(`   │ ${'hr@maxhub.com'.padEnd(39)} │ ${'hr'.padEnd(14)} │ HR Manager          │`);
    console.log(`   │ ${'hod@maxhub.com'.padEnd(39)} │ ${'hod'.padEnd(14)} │ Head of Department  │`);
    console.log(`   │ ${'staff@maxhub.com'.padEnd(39)} │ ${'staff'.padEnd(14)} │ General Staff       │`);
    console.log(`   │ ${'accountant@maxhub.com'.padEnd(39)} │ ${'staff'.padEnd(14)} │ Accountant          │`);
    console.log(`   │ ${'instructor@maxhub.com'.padEnd(39)} │ ${'staff'.padEnd(14)} │ Instructor          │`);
    console.log(`   │ ${'receptionist@maxhub.com'.padEnd(39)} │ ${'staff'.padEnd(14)} │ Receptionist        │`);
    console.log('   └─────────────────────────────────────────┴────────────────┴─────────────────────┘');
    console.log('\n🏖️   Seeding default leave types...');
    const leaveTypes = [
        { name: 'Annual Leave', code: 'ANNUAL', categoryType: 'Paid', maxDaysPerYear: 21, description: 'Annual paid leave entitlement' },
        { name: 'Sick Leave', code: 'SICK', categoryType: 'Paid', maxDaysPerYear: 10, description: 'Medical/health-related absence' },
        { name: 'Maternity Leave', code: 'MATERNITY', categoryType: 'Paid', maxDaysPerYear: 90, description: 'Leave for childbirth/adoption' },
        { name: 'Paternity Leave', code: 'PATERNITY', categoryType: 'Paid', maxDaysPerYear: 5, description: 'Leave for new fathers' },
        { name: 'Unpaid Leave', code: 'UNPAID', categoryType: 'Unpaid', maxDaysPerYear: 30, description: 'Approved unpaid absence' },
        { name: 'Study Leave', code: 'STUDY', categoryType: 'Paid', maxDaysPerYear: 5, description: 'Leave for exams or study' },
        { name: 'Emergency Leave', code: 'EMERGENCY', categoryType: 'Paid', maxDaysPerYear: 3, description: 'Unplanned emergency absence' },
        { name: 'Compassionate Leave', code: 'COMPASSIONATE', categoryType: 'Paid', maxDaysPerYear: 3, description: 'Bereavement / family emergency' },
    ];
    let ltCreated = 0;
    for (const lt of leaveTypes) {
        const [, created] = await retryFindOrCreate(() => LeaveType_model_1.LeaveType.findOrCreate({
            where: { code: lt.code },
            defaults: { ...lt, isActive: true },
        }));
        if (created)
            ltCreated++;
    }
    console.log(`✅  Leave types: ${ltCreated} created, ${leaveTypes.length - ltCreated} already existed`);
    console.log('\n🏢  Seeding companies...');
    const companies = [
        { code: 'KURIOS_SAT', name: 'Kurios Sat', type: 'Technology', currency: 'NGN', status: 'Active' },
        { code: 'VISA_MAX', name: 'Visa Max', type: 'Immigration', currency: 'NGN', status: 'Active' },
        { code: 'BEAD_MAX', name: 'Bead Max Designs', type: 'Fashion', currency: 'NGN', status: 'Active' },
        { code: 'BEADMAX_SCHOOL', name: 'Beadmax Vocational School', type: 'Education', currency: 'NGN', status: 'Active' },
    ];
    const companyMap = new Map();
    let compCreated = 0;
    for (const co of companies) {
        const [company, created] = await retryFindOrCreate(() => Company_model_1.Company.findOrCreate({
            where: { code: co.code },
            defaults: { ...co, settings: {} },
        }));
        companyMap.set(co.code, company.id);
        if (created) {
            compCreated++;
            console.log(`   ✨ Created → ${co.name} (${co.code})`);
        }
        else {
            console.log(`   ⏭️  Exists  → ${co.name} (${co.code})`);
        }
    }
    console.log(`✅  Companies: ${compCreated} created\n`);
    console.log('🎓  Seeding demo student user...');
    const STUDENT_EMAIL = 'student@maxhub.com';
    const studentPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const [studentUser, studentCreated] = await retryFindOrCreate(() => User_model_1.User.findOrCreate({
        where: { email: STUDENT_EMAIL },
        defaults: {
            uuid: (0, uuid_1.v4)(),
            firstName: 'Ada',
            lastName: 'Okonkwo',
            email: STUDENT_EMAIL,
            passwordHash: studentPasswordHash,
            status: 'Active',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            loginAttempts: 0,
        },
    }));
    if (!studentCreated) {
        await studentUser.update({ passwordHash: studentPasswordHash, loginAttempts: 0, lockedUntil: null });
    }
    const studentRoleId = roleMap.get(RolesConfig_1.RoleCode.STUDENT);
    if (studentRoleId) {
        await retryFindOrCreate(() => UserRole_model_1.UserRole.findOrCreate({
            where: { userId: studentUser.id, roleId: studentRoleId },
            defaults: { userId: studentUser.id, roleId: studentRoleId, assignedAt: new Date() },
        }));
    }
    const schoolId = companyMap.get('BEADMAX_SCHOOL');
    if (schoolId) {
        const year = new Date().getFullYear();
        const studentCount = await StudentProfile_model_1.StudentProfile.count();
        const studentNumber = `BVS-${year}-${String(studentCount + 1).padStart(5, '0')}`;
        await StudentProfile_model_1.StudentProfile.findOrCreate({
            where: { userId: studentUser.id },
            defaults: {
                uuid: (0, uuid_1.v4)(),
                userId: studentUser.id,
                companyId: schoolId,
                studentNumber,
                gender: 'Female',
                enrollmentDate: new Date(),
                status: 'Active',
            },
        });
    }
    console.log(`✅  Demo student: ${studentCreated ? 'created' : 'updated'}`);
    console.log(`    Email   : ${STUDENT_EMAIL}`);
    console.log(`    Password: ${DEMO_PASSWORD}\n`);
    console.log('\n' + '═'.repeat(55));
    console.log('🎉  Seeding complete!');
    console.log('═'.repeat(55));
    console.log('\nNext steps:');
    console.log('  1. Start the backend:  cd backend && npm run dev');
    console.log('  2. Start the frontend: cd frontend && npm run dev');
    console.log(`  3. Login with:         ${SUPER_ADMIN_EMAIL}`);
    console.log(`                         ${SUPER_ADMIN_PASSWORD}`);
    console.log('\n');
    await sequelize.close();
    process.exit(0);
}
main().catch((err) => {
    console.error('\n❌  Seeder failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map