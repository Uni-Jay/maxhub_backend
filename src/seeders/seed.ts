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
import { StaffDepartment } from '../models/StaffDepartment.model';
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

type PermissionScope = 'all' | 'own' | 'own_department' | 'own_warehouse';

function parsePermissionCode(code: string): {
  module: string;
  resource: string;
  action: string;
  scope: PermissionScope;
} {
  const parts = code.split('.');
  const scope = parts[parts.length - 1] as PermissionScope;
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
  const scopeLabel =
    scope === 'own_department' ? 'Own Dept' :
    scope === 'own_warehouse' ? 'Own Warehouse' :
    scope === 'own' ? 'Own' : 'All';
  return `${toTitleCase(module)} › ${toTitleCase(resource)} › ${toTitleCase(action)} [${scopeLabel}]`;
}

async function retryFindOrCreate<T>(
  fn: () => Promise<[T, boolean]>,
  maxAttempts = 3,
  delayMs = 2000
): Promise<[T, boolean]> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTransactionErr = err?.message?.includes('transaction') ||
        err?.parent?.errno === 1213 || err?.original?.errno === 1213;
      if (isTransactionErr && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error('retryFindOrCreate: max attempts exceeded');
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
    pool: { max: 1, min: 0, idle: 10000 },
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
  StaffDepartment.initModel(sequelize);
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
  let syncAttempt = 0;
  while (true) {
    try {
      // Use plain sync() to create missing tables without ALTER (avoids deadlocks on shared DBs).
      // Schema column changes require a manual migration or a one-time force run.
      await sequelize.sync();
      console.log('✅  All tables synced\n');
      break;
    } catch (err: any) {
      const isDeadlock = err?.parent?.errno === 1213 || err?.original?.errno === 1213;
      if (isDeadlock && syncAttempt < 5) {
        syncAttempt++;
        console.warn(`   ⚠️  Deadlock on attempt ${syncAttempt}, retrying in 5s...`);
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        console.error('❌  Table sync failed:', err);
        process.exit(1);
      }
    }
  }

  // ── 4. Seed Permissions ─────────────────────────────────────────────────────
  console.log('🔐  Seeding permissions...');
  const allCodes = Object.values(PermissionCode);
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
  await Permission.bulkCreate(permRows as any, { ignoreDuplicates: true });
  console.log(`✅  Permissions: ${allCodes.length} total (new ones inserted, duplicates ignored)\n`);

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
    const [role, created] = await retryFindOrCreate(() =>
      Role.findOrCreate({
        where: { code: roleCode },
        defaults: {
          code: roleCode,
          name: ROLE_NAMES[roleCode],
          description: ROLE_DESCRIPTIONS[roleCode],
          isSystemRole: true,
          isActive: true,
        },
      })
    );
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

  const rpRows: { roleId: bigint; permissionId: bigint }[] = [];
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS) as [RoleCode, PermissionCode[]][]) {
    const roleId = roleMap.get(roleCode);
    if (!roleId) continue;
    for (const permCode of permCodes) {
      const permId = permMap.get(permCode);
      if (!permId) {
        console.warn(`   ⚠️  Permission not found in DB: ${permCode}`);
        continue;
      }
      rpRows.push({ roleId, permissionId: permId });
    }
  }

  // Batch upsert — INSERT IGNORE — single round trip per chunk
  const CHUNK = 100;
  let rpCreated = 0;
  for (let i = 0; i < rpRows.length; i += CHUNK) {
    const chunk = rpRows.slice(i, i + CHUNK);
    const result = await RolePermission.bulkCreate(chunk as any, { ignoreDuplicates: true });
    rpCreated += result.length;
  }
  console.log(`✅  Role-permissions: ${rpRows.length} total pairs processed (${rpCreated} inserted)\n`);

  // ── 7. Seed Default Super Admin User ────────────────────────────────────────
  console.log('👤  Seeding default Super Admin user...');

  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@maxhub.com';
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'MaxHub@Admin2024!';

  const superAdminHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  const [superAdmin, userCreated] = await retryFindOrCreate(() =>
    User.findOrCreate({
      where: { email: SUPER_ADMIN_EMAIL },
      defaults: {
        uuid: uuidv4(),
        firstName: 'Super',
        lastName: 'Admin',
        email: SUPER_ADMIN_EMAIL,
        passwordHash: superAdminHash,
        status: 'Active',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        loginAttempts: 0,
      },
    })
  );

  if (userCreated) {
    // Assign SUPER_ADMIN role
    const superAdminRoleId = roleMap.get(RoleCode.SUPER_ADMIN);
    if (superAdminRoleId) {
      await retryFindOrCreate(() =>
        UserRole.findOrCreate({
          where: { userId: superAdmin.id, roleId: superAdminRoleId },
          defaults: { userId: superAdmin.id, roleId: superAdminRoleId, assignedAt: new Date() },
        })
      );
    }
    console.log(`✅  Super Admin created`);
    console.log(`    Email   : ${SUPER_ADMIN_EMAIL}`);
    console.log(`    Password: ${SUPER_ADMIN_PASSWORD}`);
  } else {
    console.log(`⏭️  Super Admin already exists (${SUPER_ADMIN_EMAIL})`);
  }

  // ── 8. Seed Role Demo Users ─────────────────────────────────────────────────
  console.log('\n👥  Seeding role demo users...');

  const DEMO_PASSWORD = 'Demo@12345!';
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const demoUsers: Array<{ email: string; firstName: string; lastName: string; role: RoleCode }> = [
    { email: 'admin@maxhub.com',        firstName: 'Admin',       lastName: 'User',       role: RoleCode.ADMIN },
    { email: 'depthead@maxhub.com',    firstName: 'Dept',        lastName: 'Head',       role: RoleCode.DEPARTMENT_HEAD },
    { email: 'manager@maxhub.com',     firstName: 'Project',     lastName: 'Manager',    role: RoleCode.MANAGER },
    { email: 'supervisor@maxhub.com',  firstName: 'Team',        lastName: 'Supervisor', role: RoleCode.SUPERVISOR },
    { email: 'teamlead@maxhub.com',    firstName: 'Team',        lastName: 'Lead',       role: RoleCode.TEAM_LEAD },
    { email: 'staff@maxhub.com',       firstName: 'Regular',     lastName: 'Staff',      role: RoleCode.STAFF },
    { email: 'consultant@maxhub.com',  firstName: 'External',    lastName: 'Consultant', role: RoleCode.CONSULTANT },
    { email: 'intern@maxhub.com',      firstName: 'New',         lastName: 'Intern',     role: RoleCode.INTERN },
  ];

  let demoCreated = 0;
  for (const demo of demoUsers) {
    const [demoUser, created] = await retryFindOrCreate(() =>
      User.findOrCreate({
        where: { email: demo.email },
        defaults: {
          uuid: uuidv4(),
          firstName: demo.firstName,
          lastName: demo.lastName,
          email: demo.email,
          passwordHash: demoPasswordHash,
          status: 'Active',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          loginAttempts: 0,
        },
      })
    );

    if (!created) {
      // Ensure password is always Demo@12345! even if the account already existed
      await demoUser.update({ passwordHash: demoPasswordHash, loginAttempts: 0, lockedUntil: null });
    }
    const roleId = roleMap.get(demo.role);
    if (roleId) {
      await retryFindOrCreate(() =>
        UserRole.findOrCreate({
          where: { userId: demoUser.id, roleId },
          defaults: { userId: demoUser.id, roleId, assignedAt: new Date() },
        })
      );
    }
    if (created) {
      demoCreated++;
      console.log(`   ✨ Created → ${demo.email} [${demo.role}]`);
    } else {
      console.log(`   ✅ Updated → ${demo.email} [${demo.role}] (password reset to Demo@12345!)`);
    }
  }

  console.log(`\n✅  Demo users: ${demoCreated} created\n`);
  console.log('   All demo accounts use password: Demo@12345!');
  console.log('   ┌─────────────────────────────────┬──────────────────────┐');
  console.log('   │ Email                           │ Role                 │');
  console.log('   ├─────────────────────────────────┼──────────────────────┤');
  console.log(`   │ ${'superadmin@maxhub.com'.padEnd(31)} │ SUPER_ADMIN          │`);
  for (const d of demoUsers) {
    console.log(`   │ ${d.email.padEnd(31)} │ ${d.role.padEnd(20)} │`);
  }
  console.log('   └─────────────────────────────────┴──────────────────────┘');

  // ── 9. Seed Default Leave Types ─────────────────────────────────────────────
  console.log('\n🏖️   Seeding default leave types...');
  const leaveTypes = [
    { name: 'Annual Leave',       code: 'ANNUAL',       categoryType: 'Paid',   maxDaysPerYear: 21, description: 'Annual paid leave entitlement' },
    { name: 'Sick Leave',         code: 'SICK',         categoryType: 'Paid',   maxDaysPerYear: 10, description: 'Medical/health-related absence' },
    { name: 'Maternity Leave',    code: 'MATERNITY',    categoryType: 'Paid',   maxDaysPerYear: 90, description: 'Leave for childbirth/adoption' },
    { name: 'Paternity Leave',    code: 'PATERNITY',    categoryType: 'Paid',   maxDaysPerYear: 5,  description: 'Leave for new fathers' },
    { name: 'Unpaid Leave',       code: 'UNPAID',       categoryType: 'Unpaid', maxDaysPerYear: 30, description: 'Approved unpaid absence' },
    { name: 'Study Leave',        code: 'STUDY',        categoryType: 'Paid',   maxDaysPerYear: 5,  description: 'Leave for exams or study' },
    { name: 'Emergency Leave',    code: 'EMERGENCY',    categoryType: 'Paid',   maxDaysPerYear: 3,  description: 'Unplanned emergency absence' },
    { name: 'Compassionate Leave',code: 'COMPASSIONATE',categoryType: 'Paid',   maxDaysPerYear: 3,  description: 'Bereavement / family emergency' },
  ];

  let ltCreated = 0;
  for (const lt of leaveTypes) {
    const [, created] = await retryFindOrCreate(() =>
      LeaveType.findOrCreate({
        where: { code: lt.code },
        defaults: { ...lt, isActive: true } as any,
      })
    );
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
