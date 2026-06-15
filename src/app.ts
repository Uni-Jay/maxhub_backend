import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Allow BigInt values to serialize in JSON responses (IDs, counts, etc.)
(BigInt.prototype as unknown as { toJSON(): number }).toJSON = function () {
  return Number(this);
};

// Import models
import { User } from '@models/User.model';
import { Role } from '@models/Role.model';
import { Permission } from '@models/Permission.model';
import { UserRole } from '@models/UserRole.model';
import { RolePermission } from '@models/RolePermission.model';
import { UserPermission } from '@models/UserPermission.model';
import { Session } from '@models/Session.model';
import { OTPVerification } from '@models/OTPVerification.model';
import { TwoFactorAuth } from '@models/TwoFactorAuth.model';
import { DeviceLog } from '@models/DeviceLog.model';
import { PasswordReset } from '@models/PasswordReset.model';
import { Department } from '@models/Department.model';
import { Designation } from '@models/Designation.model';
import { Location } from '@models/Location.model';
import { Staff } from '@models/Staff.model';
import { StaffDepartment } from '@models/StaffDepartment.model';
import { StaffQualification } from '@models/StaffQualification.model';
import { StaffSkill } from '@models/StaffSkill.model';
import { StaffDocument } from '@models/StaffDocument.model';
import { Shift } from '@models/Shift.model';
import { Attendance } from '@models/Attendance.model';
import { Timesheet } from '@models/Timesheet.model';
import { AttendanceLog } from '@models/AttendanceLog.model';
import { LeaveType } from '@models/LeaveType.model';
import { LeaveBalance } from '@models/LeaveBalance.model';
import { LeaveRequest } from '@models/LeaveRequest.model';
import { Project } from '@models/Project.model';
import { Milestone } from '@models/Milestone.model';
import { Task } from '@models/Task.model';
import { Contact } from '@models/Contact.model';
import { Opportunity } from '@models/Opportunity.model';
import { SalaryStructure } from '@models/SalaryStructure.model';
import { PayrollPeriod } from '@models/PayrollPeriod.model';
import { EmployeeSalary } from '@models/EmployeeSalary.model';
import { Course } from '@models/Course.model';
import { JobPosting } from '@models/JobPosting.model';
// Extended recruitment models
import { JobApplication } from '@models/JobApplication.model';
import { Interview } from '@models/Interview.model';
import { JobOffer } from '@models/JobOffer.model';
import { OnboardingTask } from '@models/OnboardingTask.model';
// Extended learning models
import { CourseModule } from '@models/CourseModule.model';
import { CourseContent } from '@models/CourseContent.model';
import { Enrollment } from '@models/Enrollment.model';
import { Exam } from '@models/Exam.model';
import { Question } from '@models/Question.model';
import { ExamResult } from '@models/ExamResult.model';
import { Certificate } from '@models/Certificate.model';
import { Assignment } from '@models/Assignment.model';
import { Submission } from '@models/Submission.model';
// Messaging and communication models
import { Conversation } from '@models/Conversation.model';
import { ConversationParticipant } from '@models/ConversationParticipant.model';
import { Message } from '@models/Message.model';
import { MessageRead } from '@models/MessageRead.model';
// Notifications
import { Notification } from '@models/Notification.model';
// CRM extended models
import { Account } from '@models/Account.model';
import { Activity } from '@models/Activity.model';
import { Quote } from '@models/Quote.model';
import { Order } from '@models/Order.model';
// Payroll extended models
import { SalaryComponent } from '@models/SalaryComponent.model';
import { ChartOfAccounts } from '@models/ChartOfAccounts.model';
import { JournalEntry } from '@models/JournalEntry.model';
import { Invoice } from '@models/Invoice.model';
import { Payment } from '@models/Payment.model';
// Inventory models
import { InventoryCategory } from '@models/InventoryCategory.model';
import { InventoryItem } from '@models/InventoryItem.model';
import { Warehouse } from '@models/Warehouse.model';
import { WarehouseStock } from '@models/WarehouseStock.model';
import { StockTransaction } from '@models/StockTransaction.model';
import { Supplier } from '@models/Supplier.model';
import { PurchaseOrder } from '@models/PurchaseOrder.model';
// Budget and financial models
import { Budget } from '@models/Budget.model';
// HR models
import { Appraisal } from '@models/Appraisal.model';
import { Goal } from '@models/Goal.model';
import { Feedback } from '@models/Feedback.model';
import { EmployeeDocument } from '@models/EmployeeDocument.model';
import { HolidayCalendar } from '@models/HolidayCalendar.model';
import { BenefitType } from '@models/BenefitType.model';
import { TrainingProgram } from '@models/TrainingProgram.model';
import { TrainingAttendance } from '@models/TrainingAttendance.model';
import { Expense } from '@models/Expense.model';
// Asset models
import { AssetType } from '@models/AssetType.model';
import { Asset } from '@models/Asset.model';
// Project documentation
import { ProjectNote } from '@models/ProjectNote.model';
// Survey and feedback
import { Survey } from '@models/Survey.model';
import { Complaint } from '@models/Complaint.model';
// System models
import { SystemSetting } from '@models/SystemSetting.model';
import { AuditLog } from '@models/AuditLog.model';
import { AssociationManager } from '@models/Associations';
// New feature models
import { StaffQuery } from '@models/StaffQuery.model';
import { StaffQueryReply } from '@models/StaffQueryReply.model';
import { Client } from '@models/Client.model';
import { ClientDocument } from '@models/ClientDocument.model';
import { ClientNote } from '@models/ClientNote.model';
import { MessageTemplate } from '@models/MessageTemplate.model';
import { CommunicationLog } from '@models/CommunicationLog.model';

// Import middleware
import { AuthMiddleware } from '@middleware/AuthMiddleware';

// Import utilities
import { ErrorHandler } from '@utils/ErrorHandler';
import { ResponseFormatter } from '@utils/ResponseFormatter';

// Import routes
import setupRoutes from './routes/index';

// Import scheduler
import { startScheduler } from './services/SchedulerService';

// Load environment variables
dotenv.config();

class AppBootstrapper {
  private app: Express;
  private sequelize: Sequelize;

  constructor() {
    this.app = express();
    this.sequelize = new Sequelize({
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

  /**
   * Initialize middleware
   */
  private initMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // CORS
    const allowedOrigins = (
      process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:3000'
    ).split(',');
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
          }
        },
        credentials: true,
      })
    );

    // Request body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Request ID for tracing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      (req as any).id = Math.random().toString(36).substr(2, 9);
      next();
    });

    // Request metadata
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.metadata = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date(),
      };
      next();
    });

    console.log('✅ Middleware initialized');
  }

  /**
   * Initialize all Sequelize models
   */
  private initModels(): void {
    // Authentication models
    User.initModel(this.sequelize);
    Role.initModel(this.sequelize);
    Permission.initModel(this.sequelize);
    UserRole.initModel(this.sequelize);
    RolePermission.initModel(this.sequelize);
    UserPermission.initModel(this.sequelize);
    Session.initModel(this.sequelize);
    OTPVerification.initModel(this.sequelize);
    TwoFactorAuth.initModel(this.sequelize);
    DeviceLog.initModel(this.sequelize);
    PasswordReset.initModel(this.sequelize);

    // Organizational models
    Department.initModel(this.sequelize);
    Designation.initModel(this.sequelize);
    Location.initModel(this.sequelize);
    Staff.initModel(this.sequelize);
    StaffDepartment.initModel(this.sequelize);
    StaffQualification.initModel(this.sequelize);
    StaffSkill.initModel(this.sequelize);
    StaffDocument.initModel(this.sequelize);

    // Attendance models
    Shift.initModel(this.sequelize);
    Attendance.initModel(this.sequelize);
    Timesheet.initModel(this.sequelize);
    AttendanceLog.initModel(this.sequelize);

    // Leave models
    LeaveType.initModel(this.sequelize);
    LeaveBalance.initModel(this.sequelize);
    LeaveRequest.initModel(this.sequelize);

    // Project models
    Project.initModel(this.sequelize);
    Milestone.initModel(this.sequelize);
    Task.initModel(this.sequelize);

    // CRM models
    Contact.initModel(this.sequelize);
    Opportunity.initModel(this.sequelize);

    // Payroll models
    SalaryStructure.initModel(this.sequelize);
    PayrollPeriod.initModel(this.sequelize);
    EmployeeSalary.initModel(this.sequelize);

    // Learning models
    Course.initModel(this.sequelize);
    CourseModule.initModel(this.sequelize);
    CourseContent.initModel(this.sequelize);
    Enrollment.initModel(this.sequelize);
    Exam.initModel(this.sequelize);
    Question.initModel(this.sequelize);
    ExamResult.initModel(this.sequelize);
    Certificate.initModel(this.sequelize);
    Assignment.initModel(this.sequelize);
    Submission.initModel(this.sequelize);

    // Recruitment models
    JobPosting.initModel(this.sequelize);
    JobApplication.initModel(this.sequelize);
    Interview.initModel(this.sequelize);
    JobOffer.initModel(this.sequelize);
    OnboardingTask.initModel(this.sequelize);

    // Messaging and communication models
    Conversation.initModel(this.sequelize);
    ConversationParticipant.initModel(this.sequelize);
    Message.initModel(this.sequelize);
    MessageRead.initModel(this.sequelize);

    // Notifications
    Notification.initModel(this.sequelize);

    // CRM extended models
    Account.initModel(this.sequelize);
    Activity.initModel(this.sequelize);
    Quote.initModel(this.sequelize);
    Order.initModel(this.sequelize);

    // Payroll and accounting models
    SalaryComponent.initModel(this.sequelize);
    ChartOfAccounts.initModel(this.sequelize);
    JournalEntry.initModel(this.sequelize);
    Invoice.initModel(this.sequelize);
    Payment.initModel(this.sequelize);

    // Inventory models
    InventoryCategory.initModel(this.sequelize);
    InventoryItem.initModel(this.sequelize);
    Warehouse.initModel(this.sequelize);
    WarehouseStock.initModel(this.sequelize);
    StockTransaction.initModel(this.sequelize);
    Supplier.initModel(this.sequelize);
    PurchaseOrder.initModel(this.sequelize);

    // Budget and financial models
    Budget.initModel(this.sequelize);

    // HR and employee models
    Appraisal.initModel(this.sequelize);
    Goal.initModel(this.sequelize);
    Feedback.initModel(this.sequelize);
    EmployeeDocument.initModel(this.sequelize);
    HolidayCalendar.initModel(this.sequelize);
    BenefitType.initModel(this.sequelize);
    TrainingProgram.initModel(this.sequelize);
    TrainingAttendance.initModel(this.sequelize);
    Expense.initModel(this.sequelize);

    // Asset models
    AssetType.initModel(this.sequelize);
    Asset.initModel(this.sequelize);

    // Project documentation
    ProjectNote.initModel(this.sequelize);

    // Survey and feedback models
    Survey.initModel(this.sequelize);
    Complaint.initModel(this.sequelize);

    // System models
    SystemSetting.initModel(this.sequelize);
    AuditLog.initModel(this.sequelize);

    // New feature models
    StaffQuery.initModel(this.sequelize);
    StaffQueryReply.initModel(this.sequelize);
    Client.initModel(this.sequelize);
    ClientDocument.initModel(this.sequelize);
    ClientNote.initModel(this.sequelize);
    MessageTemplate.initModel(this.sequelize);
    CommunicationLog.initModel(this.sequelize);

    console.log('✅ 90+ models initialized');
  }

  /**
   * Initialize all associations
   */
  private initAssociations(): void {
    AssociationManager.initializeAssociations(this.sequelize);
    console.log('✅ All associations initialized');
  }

  /**
   * Setup all routes and error handling
   */
  private initRoutes(): void {
    setupRoutes(this.app);
    console.log('✅ Routes and error handling initialized');
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      // Initialize middleware
      this.initMiddleware();

      // Initialize models
      this.initModels();

      // Initialize associations
      this.initAssociations();

      // Setup Sequelize
      this.app.set('sequelize', this.sequelize);

      // Setup routes and error handling
      this.initRoutes();

      // Database connection
      console.log('📡 Connecting to database...');
      await this.sequelize.authenticate();
      console.log('✅ Database connected');

      // Sync models (in production, use migrations instead)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Syncing database schema...');
        await this.sequelize.sync({ alter: process.env.DB_FORCE_SYNC === 'true' });
        console.log('✅ Database synced');
      }

      // Start scheduler (cron jobs)
      startScheduler();

      // Start server
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
    } catch (error) {
      console.error('❌ Failed to start application:', error);
      process.exit(1);
    }
  }
}

export { AppBootstrapper };
