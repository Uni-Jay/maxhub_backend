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
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const Database_1 = require("./config/Database");
const ChatSocket_1 = require("./socket/ChatSocket");
BigInt.prototype.toJSON = function () {
    return Number(this);
};
const User_model_1 = require("./models/User.model");
const Role_model_1 = require("./models/Role.model");
const Permission_model_1 = require("./models/Permission.model");
const UserRole_model_1 = require("./models/UserRole.model");
const RolePermission_model_1 = require("./models/RolePermission.model");
const UserPermission_model_1 = require("./models/UserPermission.model");
const Session_model_1 = require("./models/Session.model");
const OTPVerification_model_1 = require("./models/OTPVerification.model");
const TwoFactorAuth_model_1 = require("./models/TwoFactorAuth.model");
const DeviceLog_model_1 = require("./models/DeviceLog.model");
const PasswordReset_model_1 = require("./models/PasswordReset.model");
const Department_model_1 = require("./models/Department.model");
const Designation_model_1 = require("./models/Designation.model");
const Location_model_1 = require("./models/Location.model");
const Staff_model_1 = require("./models/Staff.model");
const StaffDepartment_model_1 = require("./models/StaffDepartment.model");
const StaffQualification_model_1 = require("./models/StaffQualification.model");
const StaffSkill_model_1 = require("./models/StaffSkill.model");
const StaffDocument_model_1 = require("./models/StaffDocument.model");
const Shift_model_1 = require("./models/Shift.model");
const Attendance_model_1 = require("./models/Attendance.model");
const Overtime_model_1 = require("./models/Overtime.model");
const Timesheet_model_1 = require("./models/Timesheet.model");
const AttendanceLog_model_1 = require("./models/AttendanceLog.model");
const LeaveType_model_1 = require("./models/LeaveType.model");
const LeaveBalance_model_1 = require("./models/LeaveBalance.model");
const LeaveRequest_model_1 = require("./models/LeaveRequest.model");
const Project_model_1 = require("./models/Project.model");
const Milestone_model_1 = require("./models/Milestone.model");
const Task_model_1 = require("./models/Task.model");
const ProjectComment_model_1 = require("./models/ProjectComment.model");
const Contact_model_1 = require("./models/Contact.model");
const Opportunity_model_1 = require("./models/Opportunity.model");
const SalaryStructure_model_1 = require("./models/SalaryStructure.model");
const PayrollPeriod_model_1 = require("./models/PayrollPeriod.model");
const EmployeeSalary_model_1 = require("./models/EmployeeSalary.model");
const Course_model_1 = require("./models/Course.model");
const JobPosting_model_1 = require("./models/JobPosting.model");
const JobSyncLog_model_1 = require("./models/JobSyncLog.model");
const WeeklyReport_model_1 = require("./models/WeeklyReport.model");
const CalendarEvent_model_1 = require("./models/CalendarEvent.model");
const FileRecord_model_1 = require("./models/FileRecord.model");
const Customer_model_1 = require("./models/Customer.model");
const OrderTracking_model_1 = require("./models/OrderTracking.model");
const Broadcast_model_1 = require("./models/Broadcast.model");
const JobApplication_model_1 = require("./models/JobApplication.model");
const Interview_model_1 = require("./models/Interview.model");
const JobOffer_model_1 = require("./models/JobOffer.model");
const OnboardingTask_model_1 = require("./models/OnboardingTask.model");
const CourseModule_model_1 = require("./models/CourseModule.model");
const CourseContent_model_1 = require("./models/CourseContent.model");
const Enrollment_model_1 = require("./models/Enrollment.model");
const Exam_model_1 = require("./models/Exam.model");
const Question_model_1 = require("./models/Question.model");
const ExamResult_model_1 = require("./models/ExamResult.model");
const Certificate_model_1 = require("./models/Certificate.model");
const FeeReceipt_model_1 = require("./models/FeeReceipt.model");
const Assignment_model_1 = require("./models/Assignment.model");
const Submission_model_1 = require("./models/Submission.model");
const Conversation_model_1 = require("./models/Conversation.model");
const ConversationParticipant_model_1 = require("./models/ConversationParticipant.model");
const Message_model_1 = require("./models/Message.model");
const MessageRead_model_1 = require("./models/MessageRead.model");
const Notification_model_1 = require("./models/Notification.model");
const Account_model_1 = require("./models/Account.model");
const Activity_model_1 = require("./models/Activity.model");
const Quote_model_1 = require("./models/Quote.model");
const Order_model_1 = require("./models/Order.model");
const SalaryComponent_model_1 = require("./models/SalaryComponent.model");
const ChartOfAccounts_model_1 = require("./models/ChartOfAccounts.model");
const JournalEntry_model_1 = require("./models/JournalEntry.model");
const Invoice_model_1 = require("./models/Invoice.model");
const Payment_model_1 = require("./models/Payment.model");
const InventoryCategory_model_1 = require("./models/InventoryCategory.model");
const InventoryItem_model_1 = require("./models/InventoryItem.model");
const Warehouse_model_1 = require("./models/Warehouse.model");
const WarehouseStock_model_1 = require("./models/WarehouseStock.model");
const StockTransaction_model_1 = require("./models/StockTransaction.model");
const Supplier_model_1 = require("./models/Supplier.model");
const PurchaseOrder_model_1 = require("./models/PurchaseOrder.model");
const Budget_model_1 = require("./models/Budget.model");
const Appraisal_model_1 = require("./models/Appraisal.model");
const EmployeePromotion_model_1 = require("./models/EmployeePromotion.model");
const Goal_model_1 = require("./models/Goal.model");
const Feedback_model_1 = require("./models/Feedback.model");
const EmployeeDocument_model_1 = require("./models/EmployeeDocument.model");
const HolidayCalendar_model_1 = require("./models/HolidayCalendar.model");
const BenefitType_model_1 = require("./models/BenefitType.model");
const TrainingProgram_model_1 = require("./models/TrainingProgram.model");
const TrainingAttendance_model_1 = require("./models/TrainingAttendance.model");
const Expense_model_1 = require("./models/Expense.model");
const AssetType_model_1 = require("./models/AssetType.model");
const Asset_model_1 = require("./models/Asset.model");
const ProjectNote_model_1 = require("./models/ProjectNote.model");
const Survey_model_1 = require("./models/Survey.model");
const Complaint_model_1 = require("./models/Complaint.model");
const SystemSetting_model_1 = require("./models/SystemSetting.model");
const AuditLog_model_1 = require("./models/AuditLog.model");
const Branch_model_1 = require("./models/Branch.model");
const Unit_model_1 = require("./models/Unit.model");
const Associations_1 = require("./models/Associations");
const StaffQuery_model_1 = require("./models/StaffQuery.model");
const StaffQueryReply_model_1 = require("./models/StaffQueryReply.model");
const Client_model_1 = require("./models/Client.model");
const ClientDocument_model_1 = require("./models/ClientDocument.model");
const ClientNote_model_1 = require("./models/ClientNote.model");
const MessageTemplate_model_1 = require("./models/MessageTemplate.model");
const CommunicationLog_model_1 = require("./models/CommunicationLog.model");
const Company_model_1 = require("./models/Company.model");
const Program_model_1 = require("./models/Program.model");
const StudentProfile_model_1 = require("./models/StudentProfile.model");
const StudentEnrollment_model_1 = require("./models/StudentEnrollment.model");
const StudentResult_model_1 = require("./models/StudentResult.model");
const StudentAttendance_model_1 = require("./models/StudentAttendance.model");
const ClassSchedule_model_1 = require("./models/ClassSchedule.model");
const Meeting_model_1 = require("./models/Meeting.model");
const MeetingParticipant_model_1 = require("./models/MeetingParticipant.model");
const Call_model_1 = require("./models/Call.model");
const Module_model_1 = require("./models/Module.model");
const UserModulePermission_model_1 = require("./models/UserModulePermission.model");
const index_1 = __importDefault(require("./routes/index"));
const AIConversation_model_1 = require("./modules/ai/models/AIConversation.model");
const AIMessage_model_1 = require("./modules/ai/models/AIMessage.model");
const AIMeetingSummary_model_1 = require("./modules/ai/models/AIMeetingSummary.model");
const AIReminder_model_1 = require("./modules/ai/models/AIReminder.model");
const SchedulerService_1 = require("./services/SchedulerService");
dotenv.config();
class AppBootstrapper {
    constructor() {
        this.app = (0, express_1.default)();
        this.sequelize = Database_1.DatabaseConfig.getInstance();
    }
    initMiddleware() {
        this.app.use((0, helmet_1.default)());
        const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',');
        const corsOptions = {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error(`CORS: Origin ${origin} not allowed`));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        };
        this.app.options('*', (0, cors_1.default)(corsOptions));
        this.app.use((0, cors_1.default)(corsOptions));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
        this.app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
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
        TwoFactorAuth_model_1.TwoFactorAuth.initModel(this.sequelize);
        DeviceLog_model_1.DeviceLog.initModel(this.sequelize);
        PasswordReset_model_1.PasswordReset.initModel(this.sequelize);
        Branch_model_1.Branch.initModel(this.sequelize);
        Unit_model_1.Unit.initModel(this.sequelize);
        Department_model_1.Department.initModel(this.sequelize);
        Designation_model_1.Designation.initModel(this.sequelize);
        Location_model_1.Location.initModel(this.sequelize);
        Staff_model_1.Staff.initModel(this.sequelize);
        StaffDepartment_model_1.StaffDepartment.initModel(this.sequelize);
        StaffQualification_model_1.StaffQualification.initModel(this.sequelize);
        StaffSkill_model_1.StaffSkill.initModel(this.sequelize);
        StaffDocument_model_1.StaffDocument.initModel(this.sequelize);
        Shift_model_1.Shift.initModel(this.sequelize);
        Attendance_model_1.Attendance.initModel(this.sequelize);
        Overtime_model_1.Overtime.initModel(this.sequelize);
        Timesheet_model_1.Timesheet.initModel(this.sequelize);
        AttendanceLog_model_1.AttendanceLog.initModel(this.sequelize);
        LeaveType_model_1.LeaveType.initModel(this.sequelize);
        LeaveBalance_model_1.LeaveBalance.initModel(this.sequelize);
        LeaveRequest_model_1.LeaveRequest.initModel(this.sequelize);
        Project_model_1.Project.initModel(this.sequelize);
        Milestone_model_1.Milestone.initModel(this.sequelize);
        Task_model_1.Task.initModel(this.sequelize);
        ProjectComment_model_1.ProjectComment.initModel(this.sequelize);
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
        FeeReceipt_model_1.FeeReceipt.initModel(this.sequelize);
        Assignment_model_1.Assignment.initModel(this.sequelize);
        Submission_model_1.Submission.initModel(this.sequelize);
        JobPosting_model_1.JobPosting.initModel(this.sequelize);
        JobSyncLog_model_1.JobSyncLog.initModel(this.sequelize);
        WeeklyReport_model_1.WeeklyReport.initModel(this.sequelize);
        CalendarEvent_model_1.CalendarEvent.initModel(this.sequelize);
        FileRecord_model_1.FileRecord.initModel(this.sequelize);
        Customer_model_1.Customer.initModel(this.sequelize);
        OrderTracking_model_1.OrderTracking.initModel(this.sequelize);
        Broadcast_model_1.Broadcast.initModel(this.sequelize);
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
        EmployeePromotion_model_1.EmployeePromotion.initModel(this.sequelize);
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
        AIConversation_model_1.AIConversation.initModel(this.sequelize);
        AIMessage_model_1.AIMessage.initModel(this.sequelize);
        AIMeetingSummary_model_1.AIMeetingSummary.initModel(this.sequelize);
        AIReminder_model_1.AIReminder.initModel(this.sequelize);
        StaffQuery_model_1.StaffQuery.initModel(this.sequelize);
        StaffQueryReply_model_1.StaffQueryReply.initModel(this.sequelize);
        Client_model_1.Client.initModel(this.sequelize);
        ClientDocument_model_1.ClientDocument.initModel(this.sequelize);
        ClientNote_model_1.ClientNote.initModel(this.sequelize);
        MessageTemplate_model_1.MessageTemplate.initModel(this.sequelize);
        CommunicationLog_model_1.CommunicationLog.initModel(this.sequelize);
        Company_model_1.Company.initModel(this.sequelize);
        Program_model_1.Program.initModel(this.sequelize);
        StudentProfile_model_1.StudentProfile.initModel(this.sequelize);
        StudentEnrollment_model_1.StudentEnrollment.initModel(this.sequelize);
        StudentResult_model_1.StudentResult.initModel(this.sequelize);
        StudentAttendance_model_1.StudentAttendance.initModel(this.sequelize);
        ClassSchedule_model_1.ClassSchedule.initModel(this.sequelize);
        Meeting_model_1.Meeting.initModel(this.sequelize);
        MeetingParticipant_model_1.MeetingParticipant.initModel(this.sequelize);
        Call_model_1.Call.initModel(this.sequelize);
        Module_model_1.AppModule.initModel(this.sequelize);
        UserModulePermission_model_1.UserModulePermission.initModel(this.sequelize);
        console.log('✅ 100+ models initialized');
    }
    initAssociations() {
        Associations_1.AssociationManager.initializeAssociations(this.sequelize);
        console.log('✅ All associations initialized');
    }
    initRoutes() {
        (0, index_1.default)(this.app);
        console.log('✅ Routes and error handling initialized');
    }
    async start() {
        try {
            this.initMiddleware();
            this.initModels();
            this.initAssociations();
            this.app.set('sequelize', this.sequelize);
            this.initRoutes();
            console.log('📡 Connecting to database...');
            await this.sequelize.authenticate();
            console.log('✅ Database connected');
            const dbSync = process.env.DB_SYNC || 'none';
            if (dbSync === 'create') {
                console.log('🔄 Syncing database schema (create missing tables)...');
                await this.sequelize.sync();
                console.log('✅ Database synced');
            }
            else if (dbSync === 'alter') {
                console.log('🔄 Syncing database schema (alter)...');
                await this.sequelize.sync({ alter: true });
                console.log('✅ Database synced');
            }
            else if (dbSync === 'force' && process.env.NODE_ENV !== 'production') {
                console.log('🔄 Syncing database schema (force)...');
                await this.sequelize.sync({ alter: true });
                console.log('✅ Database synced (force)');
            }
            else {
                console.log('ℹ️  Database sync skipped (DB_SYNC=none)');
            }
            (0, SchedulerService_1.startScheduler)();
            const port = process.env.PORT || 3000;
            const server = http_1.default.createServer({ maxHeaderSize: 524288 }, this.app);
            const io = (0, ChatSocket_1.initChatSocket)(server);
            this.app.set('io', io);
            console.log('✅ Socket.IO chat server initialized');
            server.listen(port, () => {
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