/**
 * MaxHub ERP — Database Migration & Seeder
 * Syncs all tables to the Clever Cloud database and seeds:
 *  - All permissions (from PermissionCodes enum)
 *  - All roles (from RolesConfig)
 *  - All role-permission mappings
 *  - A default SUPER_ADMIN user
 *
 * Run: npm run seed
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PermissionCode } from '../config/PermissionCodes';
import { RoleCode, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from '../config/RolesConfig';

// ─── Models ───────────────────────────────────────────────────────────────────
import { User } from '../models/User.model';
import { Role } from '../models/Role.model';
import { Permission } from '../models/Permission.model';
import { UserRole } from '../models/UserRole.model';
import { RolePermission } from '../models/RolePermission.model';
import { UserPermission } from '../models/UserPermission.model';
import { Session } from '../models/Session.model';
import { OTPVerification } from '../models/OTPVerification.model';
import { Department } from '../models/Department.model';
import { Designation } from '../models/Designation.model';
import { Location } from '../models/Location.model';
import { Staff } from '../models/Staff.model';
import { StaffQualification } from '../models/StaffQualification.model';
import { StaffSkill } from '../models/StaffSkill.model';
import { StaffDocument } from '../models/StaffDocument.model';
import { Shift } from '../models/Shift.model';
import { Attendance } from '../models/Attendance.model';
import { Timesheet } from '../models/Timesheet.model';
import { AttendanceLog } from '../models/AttendanceLog.model';
import { LeaveType } from '../models/LeaveType.model';
import { LeaveBalance } from '../models/LeaveBalance.model';
import { LeaveRequest } from '../models/LeaveRequest.model';
import { Project } from '../models/Project.model';
import { Milestone } from '../models/Milestone.model';
import { Task } from '../models/Task.model';
import { Contact } from '../models/Contact.model';
import { Opportunity } from '../models/Opportunity.model';
import { SalaryStructure } from '../models/SalaryStructure.model';
import { PayrollPeriod } from '../models/PayrollPeriod.model';
import { EmployeeSalary } from '../models/EmployeeSalary.model';
import { Course } from '../models/Course.model';
import { CourseModule } from '../models/CourseModule.model';
import { CourseContent } from '../models/CourseContent.model';
import { Enrollment } from '../models/Enrollment.model';
import { Exam } from '../models/Exam.model';
import { Question } from '../models/Question.model';
import { ExamResult } from '../models/ExamResult.model';
import { Certificate } from '../models/Certificate.model';
import { Assignment } from '../models/Assignment.model';
import { Submission } from '../models/Submission.model';
import { JobPosting } from '../models/JobPosting.model';
import { JobApplication } from '../models/JobApplication.model';
import { Interview } from '../models/Interview.model';
import { JobOffer } from '../models/JobOffer.model';
import { OnboardingTask } from '../models/OnboardingTask.model';
import { Conversation } from '../models/Conversation.model';
import { ConversationParticipant } from '../models/ConversationParticipant.model';
import { Message } from '../models/Message.model';
import { MessageRead } from '../models/MessageRead.model';
import { Notification } from '../models/Notification.model';
import { Account } from '../models/Account.model';
import { Activity } from '../models/Activity.model';
import { Quote } from '../models/Quote.model';
import { Order } from '../models/Order.model';
import { SalaryComponent } from '../models/SalaryComponent.model';
import { ChartOfAccounts } from '../models/ChartOfAccounts.model';
import { JournalEntry } from '../models/JournalEntry.model';
import { Invoice } from '../models/Invoice.model';
import { Payment } from '../models/Payment.model';
import { InventoryCategory } from '../models/InventoryCategory.model';
import { InventoryItem } from '../models/InventoryItem.model';
import { Warehouse } from '../models/Warehouse.model';
import { WarehouseStock } from '../models/WarehouseStock.model';
import { StockTransaction } from '../models/StockTransaction.model';
import { Supplier } from '../models/Supplier.model';
import { PurchaseOrder } from '../models/PurchaseOrder.model';
import { Budget } from '../models/Budget.model';
import { Appraisal } from '../models/Appraisal.model';
import { Goal } from '../models/Goal.model';
import { Feedback } from '../models/Feedback.model';
import { EmployeeDocument } from '../models/EmployeeDocument.model';
import { HolidayCalendar } from '../models/HolidayCalendar.model';
import { BenefitType } from '../models/BenefitType.model';
import { TrainingProgram } from '../models/TrainingProgram.model';
import { TrainingAttendance } from '../models/TrainingAttendance.model';
import { Expense } from '../models/Expense.model';
import { AssetType } from '../models/AssetType.model';
import { Asset } from '../models/Asset.model';
import { ProjectNote } from '../models/ProjectNote.model';
import { Survey } from '../models/Survey.model';
import { Complaint } from '../models/Complaint.model';
import { SystemSetting } from '../models/SystemSetting.model';
import { AuditLog } from '../models/AuditLog.model';
import { StaffQuery } from '../models/StaffQuery.model';
import { StaffQueryReply } from '../models/StaffQueryReply.model';
import { Client } from '../models/Client.model';
import { ClientDocument } from '../models/ClientDocument.model';
import { ClientNote } from '../models/ClientNote.model';
import { MessageTemplate } from '../models/MessageTemplate.model';
import { CommunicationLog } from '../models/CommunicationLog.model';
import { AssociationManager } from '../models/Associations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePermissionCode(code: string): {
  module: string;
  resource: string;
  action: string;
  scope: 'all' | 'own' | 'own_department';
} {
  const parts = code.split('.');
  const scope = parts[parts.length - 1] as 'all' | 'own' | 'own_department';
  const action = parts[parts.length - 2];
  const module = parts[0];
  const resource = parts.slice(1, parts.length - 2).join('.');
  return { module, resource, action, scope };
}

function toTitleCase(str: string): string {
  return str
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function makePermissionName(code: string): string {
  const { module, resource, action, scope } = parsePermissionCode(code);
  const scopeLabel = scope === 'own_department' ? 'Own Dept' : scope === 'own' ? 'Own' : 'All';
  return `${toTitleCase(module)} › ${toTitleCase(resource)} › ${toTitleCase(action)} [${scopeLabel}]`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  MaxHub ERP — Database Migration & Seeder\n');
  console.log(`📡  Host : ${process.env.DB_HOST}`);
  console.log(`🗄️   DB   : ${process.env.DB_NAME}`);
  console.log(`👤  User : ${process.env.DB_USER}\n`);

  // ── 1. Connect ──────────────────────────────────────────────────────────────
  const sequelize = new Sequelize({
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 1, idle: 10000 },
    dialectOptions: {
      ssl: false,
    },
  });

  try {
    await sequelize.authenticate();
    console.log('✅  Database connection successful\n');
  } catch (err) {
    console.error('❌  Cannot connect to database:', err);
    process.exit(1);
  }

  // ── 2. Initialize Models ────────────────────────────────────────────────────
  console.log('📦  Initializing models...');

  User.initModel(sequelize);
  Role.initModel(sequelize);
  Permission.initModel(sequelize);
  UserRole.initModel(sequelize);
  RolePermission.initModel(sequelize);
  UserPermission.initModel(sequelize);
  Session.initModel(sequelize);
  OTPVerification.initModel(sequelize);
  Department.initModel(sequelize);
  Designation.initModel(sequelize);
  Location.initModel(sequelize);
  Staff.initModel(sequelize);
  StaffQualification.initModel(sequelize);
  StaffSkill.initModel(sequelize);
  StaffDocument.initModel(sequelize);
  Shift.initModel(sequelize);
  Attendance.initModel(sequelize);
  Timesheet.initModel(sequelize);
  AttendanceLog.initModel(sequelize);
  LeaveType.initModel(sequelize);
  LeaveBalance.initModel(sequelize);
  LeaveRequest.initModel(sequelize);
  Project.initModel(sequelize);
  Milestone.initModel(sequelize);
  Task.initModel(sequelize);
  Contact.initModel(sequelize);
  Opportunity.initModel(sequelize);
  SalaryStructure.initModel(sequelize);
  PayrollPeriod.initModel(sequelize);
  EmployeeSalary.initModel(sequelize);
  Course.initModel(sequelize);
  CourseModule.initModel(sequelize);
  CourseContent.initModel(sequelize);
  Enrollment.initModel(sequelize);
  Exam.initModel(sequelize);
  Question.initModel(sequelize);
  ExamResult.initModel(sequelize);
  Certificate.initModel(sequelize);
  Assignment.initModel(sequelize);
  Submission.initModel(sequelize);
  JobPosting.initModel(sequelize);
  JobApplication.initModel(sequelize);
  Interview.initModel(sequelize);
  JobOffer.initModel(sequelize);
  OnboardingTask.initModel(sequelize);
  Conversation.initModel(sequelize);
  ConversationParticipant.initModel(sequelize);
  Message.initModel(sequelize);
  MessageRead.initModel(sequelize);
  Notification.initModel(sequelize);
  Account.initModel(sequelize);
  Activity.initModel(sequelize);
  Quote.initModel(sequelize);
  Order.initModel(sequelize);
  SalaryComponent.initModel(sequelize);
  ChartOfAccounts.initModel(sequelize);
  JournalEntry.initModel(sequelize);
  Invoice.initModel(sequelize);
  Payment.initModel(sequelize);
  InventoryCategory.initModel(sequelize);
  InventoryItem.initModel(sequelize);
  Warehouse.initModel(sequelize);
  WarehouseStock.initModel(sequelize);
  StockTransaction.initModel(sequelize);
  Supplier.initModel(sequelize);
  PurchaseOrder.initModel(sequelize);
  Budget.initModel(sequelize);
  Appraisal.initModel(sequelize);
  Goal.initModel(sequelize);
  Feedback.initModel(sequelize);
  EmployeeDocument.initModel(sequelize);
  HolidayCalendar.initModel(sequelize);
  BenefitType.initModel(sequelize);
  TrainingProgram.initModel(sequelize);
  TrainingAttendance.initModel(sequelize);
  Expense.initModel(sequelize);
  AssetType.initModel(sequelize);
  Asset.initModel(sequelize);
  ProjectNote.initModel(sequelize);
  Survey.initModel(sequelize);
  Complaint.initModel(sequelize);
  SystemSetting.initModel(sequelize);
  AuditLog.initModel(sequelize);
  StaffQuery.initModel(sequelize);
  StaffQueryReply.initModel(sequelize);
  Client.initModel(sequelize);
  ClientDocument.initModel(sequelize);
  ClientNote.initModel(sequelize);
  MessageTemplate.initModel(sequelize);
  CommunicationLog.initModel(sequelize);

  AssociationManager.initializeAssociations(sequelize);
  console.log('✅  Models initialized\n');

  // ── 3. Sync Tables ──────────────────────────────────────────────────────────
  console.log('🔄  Syncing database tables (alter: true)...');
  console.log('    This may take a moment — creating/updating all tables...');
  try {
    await sequelize.sync({ alter: true });
    console.log('✅  All tables synced\n');
  } catch (err) {
    console.error('❌  Table sync failed:', err);
    process.exit(1);
  }

  // ── 4. Seed Permissions ─────────────────────────────────────────────────────
  console.log('🔐  Seeding permissions...');
  const allCodes = Object.values(PermissionCode);
  let permCreated = 0;
  let permSkipped = 0;

  for (const code of allCodes) {
    const { module, resource, action, scope } = parsePermissionCode(code);
    const [, created] = await Permission.findOrCreate({
      where: { code },
      defaults: {
        code,
        name: makePermissionName(code),
        description: `${toTitleCase(action)} ${toTitleCase(resource)} (${scope})`,
        module,
        resource,
        action,
        scope,
        isActive: true,
      },
    });
    created ? permCreated++ : permSkipped++;
  }
  console.log(`✅  Permissions: ${permCreated} created, ${permSkipped} already existed (${allCodes.length} total)\n`);

  // ── 5. Seed Roles ───────────────────────────────────────────────────────────
  console.log('👥  Seeding roles...');
  const ROLE_NAMES: Record<RoleCode, string> = {
    [RoleCode.SUPER_ADMIN]: 'Super Administrator',
    [RoleCode.ADMIN]: 'Administrator',
    [RoleCode.DEPARTMENT_HEAD]: 'Department Head',
    [RoleCode.MANAGER]: 'Manager',
    [RoleCode.SUPERVISOR]: 'Supervisor',
    [RoleCode.TEAM_LEAD]: 'Team Lead',
    [RoleCode.STAFF]: 'Staff',
    [RoleCode.CONSULTANT]: 'Consultant',
    [RoleCode.INTERN]: 'Intern',
  };

  const roleMap = new Map<RoleCode, bigint>();

  for (const roleCode of Object.values(RoleCode)) {
    const [role, created] = await Role.findOrCreate({
      where: { code: roleCode },
      defaults: {
        code: roleCode,
        name: ROLE_NAMES[roleCode],
        description: ROLE_DESCRIPTIONS[roleCode],
        isSystemRole: true,
        isActive: true,
      },
    });
    roleMap.set(roleCode, role.id);
    console.log(`   ${created ? '✨ Created' : '⏭️  Exists '} → ${ROLE_NAMES[roleCode]} (${roleCode})`);
  }
  console.log('');

  // ── 6. Seed Role-Permission Mappings ────────────────────────────────────────
  console.log('🔗  Assigning permissions to roles...');

  // Build a code → id map for permissions
  const allPermissions = await Permission.findAll({ attributes: ['id', 'code'] });
  const permMap = new Map<string, bigint>();
  for (const p of allPermissions) {
    permMap.set(p.code, p.id);
  }

  let rpCreated = 0;
  let rpSkipped = 0;

  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS) as [RoleCode, PermissionCode[]][]) {
    const roleId = roleMap.get(roleCode);
    if (!roleId) continue;

    for (const permCode of permCodes) {
      const permId = permMap.get(permCode);
      if (!permId) {
        console.warn(`   ⚠️  Permission not found in DB: ${permCode}`);
        continue;
      }
      const [, created] = await RolePermission.findOrCreate({
        where: { roleId, permissionId: permId },
        defaults: { roleId, permissionId: permId },
      });
      created ? rpCreated++ : rpSkipped++;
    }
  }
  console.log(`✅  Role-permissions: ${rpCreated} created, ${rpSkipped} already existed\n`);

  // ── 7. Seed Default Super Admin User ────────────────────────────────────────
  console.log('👤  Seeding default Super Admin user...');

  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@maxhub.com';
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'MaxHub@Admin2024!';

  const [superAdmin, userCreated] = await User.findOrCreate({
    where: { email: SUPER_ADMIN_EMAIL },
    defaults: {
      uuid: uuidv4(),
      firstName: 'Super',
      lastName: 'Admin',
      email: SUPER_ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12),
      status: 'Active',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      loginAttempts: 0,
    },
  });

  if (userCreated) {
    // Assign SUPER_ADMIN role
    const superAdminRoleId = roleMap.get(RoleCode.SUPER_ADMIN);
    if (superAdminRoleId) {
      await UserRole.findOrCreate({
        where: { userId: superAdmin.id, roleId: superAdminRoleId },
        defaults: { userId: superAdmin.id, roleId: superAdminRoleId, assignedAt: new Date() },
      });
    }
    console.log(`✅  Super Admin created`);
    console.log(`    Email   : ${SUPER_ADMIN_EMAIL}`);
    console.log(`    Password: ${SUPER_ADMIN_PASSWORD}`);
  } else {
    console.log(`⏭️  Super Admin already exists (${SUPER_ADMIN_EMAIL})`);
  }

  // ── 8. Seed Default Leave Types ─────────────────────────────────────────────
  console.log('\n🏖️   Seeding default leave types...');
  const leaveTypes = [
    { name: 'Annual Leave',      code: 'ANNUAL',    defaultDays: 21, isPaid: true,  description: 'Annual paid leave entitlement' },
    { name: 'Sick Leave',        code: 'SICK',      defaultDays: 10, isPaid: true,  description: 'Medical/health-related absence' },
    { name: 'Maternity Leave',   code: 'MATERNITY', defaultDays: 90, isPaid: true,  description: 'Leave for childbirth/adoption' },
    { name: 'Paternity Leave',   code: 'PATERNITY', defaultDays: 5,  isPaid: true,  description: 'Leave for new fathers' },
    { name: 'Unpaid Leave',      code: 'UNPAID',    defaultDays: 30, isPaid: false, description: 'Approved unpaid absence' },
    { name: 'Study Leave',       code: 'STUDY',     defaultDays: 5,  isPaid: true,  description: 'Leave for exams or study' },
    { name: 'Emergency Leave',   code: 'EMERGENCY', defaultDays: 3,  isPaid: true,  description: 'Unplanned emergency absence' },
    { name: 'Compassionate Leave', code: 'COMPASSIONATE', defaultDays: 3, isPaid: true, description: 'Bereavement / family emergency' },
  ];

  let ltCreated = 0;
  for (const lt of leaveTypes) {
    const [, created] = await LeaveType.findOrCreate({
      where: { code: lt.code },
      defaults: { ...lt, isActive: true } as any,
    });
    if (created) ltCreated++;
  }
  console.log(`✅  Leave types: ${ltCreated} created, ${leaveTypes.length - ltCreated} already existed`);

  // ── 9. Done ─────────────────────────────────────────────────────────────────
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
