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
exports.AppBootstrapper = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const sequelize_1 = require("sequelize");
const dotenv = __importStar(require("dotenv"));
const User_model_1 = require("@models/User.model");
const Role_model_1 = require("@models/Role.model");
const Permission_model_1 = require("@models/Permission.model");
const UserRole_model_1 = require("@models/UserRole.model");
const RolePermission_model_1 = require("@models/RolePermission.model");
const UserPermission_model_1 = require("@models/UserPermission.model");
const Session_model_1 = require("@models/Session.model");
const OTPVerification_model_1 = require("@models/OTPVerification.model");
const Department_model_1 = require("@models/Department.model");
const Designation_model_1 = require("@models/Designation.model");
const Location_model_1 = require("@models/Location.model");
const Staff_model_1 = require("@models/Staff.model");
const StaffQualification_model_1 = require("@models/StaffQualification.model");
const StaffSkill_model_1 = require("@models/StaffSkill.model");
const StaffDocument_model_1 = require("@models/StaffDocument.model");
const Shift_model_1 = require("@models/Shift.model");
const Attendance_model_1 = require("@models/Attendance.model");
const Timesheet_model_1 = require("@models/Timesheet.model");
const AttendanceLog_model_1 = require("@models/AttendanceLog.model");
const LeaveType_model_1 = require("@models/LeaveType.model");
const LeaveBalance_model_1 = require("@models/LeaveBalance.model");
const LeaveRequest_model_1 = require("@models/LeaveRequest.model");
const Project_model_1 = require("@models/Project.model");
const Milestone_model_1 = require("@models/Milestone.model");
const Task_model_1 = require("@models/Task.model");
const Contact_model_1 = require("@models/Contact.model");
const Opportunity_model_1 = require("@models/Opportunity.model");
const SalaryStructure_model_1 = require("@models/SalaryStructure.model");
const PayrollPeriod_model_1 = require("@models/PayrollPeriod.model");
const EmployeeSalary_model_1 = require("@models/EmployeeSalary.model");
const Course_model_1 = require("@models/Course.model");
const JobPosting_model_1 = require("@models/JobPosting.model");
const JobApplication_model_1 = require("@models/JobApplication.model");
const Interview_model_1 = require("@models/Interview.model");
const JobOffer_model_1 = require("@models/JobOffer.model");
const OnboardingTask_model_1 = require("@models/OnboardingTask.model");
const CourseModule_model_1 = require("@models/CourseModule.model");
const CourseContent_model_1 = require("@models/CourseContent.model");
const Enrollment_model_1 = require("@models/Enrollment.model");
const Exam_model_1 = require("@models/Exam.model");
const Question_model_1 = require("@models/Question.model");
const ExamResult_model_1 = require("@models/ExamResult.model");
const Certificate_model_1 = require("@models/Certificate.model");
const Assignment_model_1 = require("@models/Assignment.model");
const Submission_model_1 = require("@models/Submission.model");
const Conversation_model_1 = require("@models/Conversation.model");
const ConversationParticipant_model_1 = require("@models/ConversationParticipant.model");
const Message_model_1 = require("@models/Message.model");
const MessageRead_model_1 = require("@models/MessageRead.model");
const Notification_model_1 = require("@models/Notification.model");
const Account_model_1 = require("@models/Account.model");
const Activity_model_1 = require("@models/Activity.model");
const Quote_model_1 = require("@models/Quote.model");
const Order_model_1 = require("@models/Order.model");
const SalaryComponent_model_1 = require("@models/SalaryComponent.model");
const ChartOfAccounts_model_1 = require("@models/ChartOfAccounts.model");
const JournalEntry_model_1 = require("@models/JournalEntry.model");
const Invoice_model_1 = require("@models/Invoice.model");
const Payment_model_1 = require("@models/Payment.model");
const InventoryCategory_model_1 = require("@models/InventoryCategory.model");
const InventoryItem_model_1 = require("@models/InventoryItem.model");
const Warehouse_model_1 = require("@models/Warehouse.model");
const WarehouseStock_model_1 = require("@models/WarehouseStock.model");
const StockTransaction_model_1 = require("@models/StockTransaction.model");
const Supplier_model_1 = require("@models/Supplier.model");
const PurchaseOrder_model_1 = require("@models/PurchaseOrder.model");
const Budget_model_1 = require("@models/Budget.model");
const Appraisal_model_1 = require("@models/Appraisal.model");
const Goal_model_1 = require("@models/Goal.model");
const Feedback_model_1 = require("@models/Feedback.model");
const EmployeeDocument_model_1 = require("@models/EmployeeDocument.model");
const HolidayCalendar_model_1 = require("@models/HolidayCalendar.model");
const BenefitType_model_1 = require("@models/BenefitType.model");
const TrainingProgram_model_1 = require("@models/TrainingProgram.model");
const TrainingAttendance_model_1 = require("@models/TrainingAttendance.model");
const Expense_model_1 = require("@models/Expense.model");
const AssetType_model_1 = require("@models/AssetType.model");
const Asset_model_1 = require("@models/Asset.model");
const ProjectNote_model_1 = require("@models/ProjectNote.model");
const Survey_model_1 = require("@models/Survey.model");
const Complaint_model_1 = require("@models/Complaint.model");
const SystemSetting_model_1 = require("@models/SystemSetting.model");
const AuditLog_model_1 = require("@models/AuditLog.model");
const Associations_1 = require("@models/Associations");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const dashboard_routes_1 = __importDefault(require("@routes/dashboard.routes"));
const auth_routes_1 = __importDefault(require("@routes/auth.routes"));
dotenv.config();
class AppBootstrapper {
    constructor() {
        this.app = (0, express_1.default)();
        this.sequelize = new sequelize_1.Sequelize({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'maxhub_erp',
            dialect: 'mysql',
            logging: process.env.NODE_ENV === 'production' ? false : console.log,
            pool: { max: 10, min: 2, idle: 10000 },
        });
    }
    initMiddleware() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
            credentials: true,
        }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
        this.app.use((req, res, next) => {
            req.id = Math.random().toString(36).substr(2, 9);
            next();
        });
        this.app.use((req, res, next) => {
            req.metadata = {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                timestamp: new Date(),
            };
            next();
        });
        console.log('✅ Middleware initialized');
    }
    initModels() {
        User_model_1.User.initModel(this.sequelize);
        Role_model_1.Role.initModel(this.sequelize);
        Permission_model_1.Permission.initModel(this.sequelize);
        UserRole_model_1.UserRole.initModel(this.sequelize);
        RolePermission_model_1.RolePermission.initModel(this.sequelize);
        UserPermission_model_1.UserPermission.initModel(this.sequelize);
        Session_model_1.Session.initModel(this.sequelize);
        OTPVerification_model_1.OTPVerification.initModel(this.sequelize);
        Department_model_1.Department.initModel(this.sequelize);
        Designation_model_1.Designation.initModel(this.sequelize);
        Location_model_1.Location.initModel(this.sequelize);
        Staff_model_1.Staff.initModel(this.sequelize);
        StaffQualification_model_1.StaffQualification.initModel(this.sequelize);
        StaffSkill_model_1.StaffSkill.initModel(this.sequelize);
        StaffDocument_model_1.StaffDocument.initModel(this.sequelize);
        Shift_model_1.Shift.initModel(this.sequelize);
        Attendance_model_1.Attendance.initModel(this.sequelize);
        Timesheet_model_1.Timesheet.initModel(this.sequelize);
        AttendanceLog_model_1.AttendanceLog.initModel(this.sequelize);
        LeaveType_model_1.LeaveType.initModel(this.sequelize);
        LeaveBalance_model_1.LeaveBalance.initModel(this.sequelize);
        LeaveRequest_model_1.LeaveRequest.initModel(this.sequelize);
        Project_model_1.Project.initModel(this.sequelize);
        Milestone_model_1.Milestone.initModel(this.sequelize);
        Task_model_1.Task.initModel(this.sequelize);
        Contact_model_1.Contact.initModel(this.sequelize);
        Opportunity_model_1.Opportunity.initModel(this.sequelize);
        SalaryStructure_model_1.SalaryStructure.initModel(this.sequelize);
        PayrollPeriod_model_1.PayrollPeriod.initModel(this.sequelize);
        EmployeeSalary_model_1.EmployeeSalary.initModel(this.sequelize);
        Course_model_1.Course.initModel(this.sequelize);
        CourseModule_model_1.CourseModule.initModel(this.sequelize);
        CourseContent_model_1.CourseContent.initModel(this.sequelize);
        Enrollment_model_1.Enrollment.initModel(this.sequelize);
        Exam_model_1.Exam.initModel(this.sequelize);
        Question_model_1.Question.initModel(this.sequelize);
        ExamResult_model_1.ExamResult.initModel(this.sequelize);
        Certificate_model_1.Certificate.initModel(this.sequelize);
        Assignment_model_1.Assignment.initModel(this.sequelize);
        Submission_model_1.Submission.initModel(this.sequelize);
        JobPosting_model_1.JobPosting.initModel(this.sequelize);
        JobApplication_model_1.JobApplication.initModel(this.sequelize);
        Interview_model_1.Interview.initModel(this.sequelize);
        JobOffer_model_1.JobOffer.initModel(this.sequelize);
        OnboardingTask_model_1.OnboardingTask.initModel(this.sequelize);
        Conversation_model_1.Conversation.initModel(this.sequelize);
        ConversationParticipant_model_1.ConversationParticipant.initModel(this.sequelize);
        Message_model_1.Message.initModel(this.sequelize);
        MessageRead_model_1.MessageRead.initModel(this.sequelize);
        Notification_model_1.Notification.initModel(this.sequelize);
        Account_model_1.Account.initModel(this.sequelize);
        Activity_model_1.Activity.initModel(this.sequelize);
        Quote_model_1.Quote.initModel(this.sequelize);
        Order_model_1.Order.initModel(this.sequelize);
        SalaryComponent_model_1.SalaryComponent.initModel(this.sequelize);
        ChartOfAccounts_model_1.ChartOfAccounts.initModel(this.sequelize);
        JournalEntry_model_1.JournalEntry.initModel(this.sequelize);
        Invoice_model_1.Invoice.initModel(this.sequelize);
        Payment_model_1.Payment.initModel(this.sequelize);
        InventoryCategory_model_1.InventoryCategory.initModel(this.sequelize);
        InventoryItem_model_1.InventoryItem.initModel(this.sequelize);
        Warehouse_model_1.Warehouse.initModel(this.sequelize);
        WarehouseStock_model_1.WarehouseStock.initModel(this.sequelize);
        StockTransaction_model_1.StockTransaction.initModel(this.sequelize);
        Supplier_model_1.Supplier.initModel(this.sequelize);
        PurchaseOrder_model_1.PurchaseOrder.initModel(this.sequelize);
        Budget_model_1.Budget.initModel(this.sequelize);
        Appraisal_model_1.Appraisal.initModel(this.sequelize);
        Goal_model_1.Goal.initModel(this.sequelize);
        Feedback_model_1.Feedback.initModel(this.sequelize);
        EmployeeDocument_model_1.EmployeeDocument.initModel(this.sequelize);
        HolidayCalendar_model_1.HolidayCalendar.initModel(this.sequelize);
        BenefitType_model_1.BenefitType.initModel(this.sequelize);
        TrainingProgram_model_1.TrainingProgram.initModel(this.sequelize);
        TrainingAttendance_model_1.TrainingAttendance.initModel(this.sequelize);
        Expense_model_1.Expense.initModel(this.sequelize);
        AssetType_model_1.AssetType.initModel(this.sequelize);
        Asset_model_1.Asset.initModel(this.sequelize);
        ProjectNote_model_1.ProjectNote.initModel(this.sequelize);
        Survey_model_1.Survey.initModel(this.sequelize);
        Complaint_model_1.Complaint.initModel(this.sequelize);
        SystemSetting_model_1.SystemSetting.initModel(this.sequelize);
        AuditLog_model_1.AuditLog.initModel(this.sequelize);
        console.log('✅ 83+ models initialized');
    }
    initAssociations() {
        Associations_1.AssociationManager.initializeAssociations(this.sequelize);
        console.log('✅ All associations initialized');
    }
    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                service: 'MaxHub ERP Backend',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        });
        this.app.get('/api/version', (req, res) => {
            res.json({
                version: process.env.APP_VERSION || '1.0.0',
                name: process.env.APP_NAME || 'MaxHub ERP',
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
            });
        });
        this.app.use('/api/auth', auth_routes_1.default);
        this.app.use('/api/dashboards', dashboard_routes_1.default);
        console.log('✅ Routes initialized');
    }
    setupErrorHandling() {
        this.app.use(ErrorMiddleware_1.ErrorMiddleware.notFound);
        this.app.use((err, req, res, next) => {
            ErrorMiddleware_1.ErrorMiddleware.handle(err, req, res, next);
        });
        console.log('✅ Error handling initialized');
    }
    async start() {
        try {
            this.initMiddleware();
            this.initModels();
            this.initAssociations();
            this.app.set('sequelize', this.sequelize);
            this.setupRoutes();
            this.setupErrorHandling();
            console.log('📡 Connecting to database...');
            await this.sequelize.authenticate();
            console.log('✅ Database connected');
            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Syncing database schema...');
                await this.sequelize.sync({ alter: process.env.DB_FORCE_SYNC === 'true' });
                console.log('✅ Database synced');
            }
            const port = process.env.PORT || 3000;
            this.app.listen(port, () => {
                console.log(`
╔════════════════════════════════════════╗
║   MaxHub ERP Backend - Server Started  ║
╠════════════════════════════════════════╣
║ 🚀 Port: ${port}
║ 🌍 Environment: ${process.env.NODE_ENV || 'development'}
║ 🗄️  Database: ${process.env.DB_NAME || 'maxhub_erp'}
║ 📊 Models: 83+
║ 🔒 RBAC: Enabled
║ ✅ Ready to accept requests
╚════════════════════════════════════════╝
        `);
            });
        }
        catch (error) {
            console.error('❌ Failed to start application:', error);
            process.exit(1);
        }
    }
}
exports.AppBootstrapper = AppBootstrapper;
//# sourceMappingURL=app.js.map