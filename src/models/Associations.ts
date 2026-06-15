import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from './User.model';
import { Role } from './Role.model';
import { Permission } from './Permission.model';
import { UserRole } from './UserRole.model';
import { RolePermission } from './RolePermission.model';
import { UserPermission } from './UserPermission.model';
import { Session } from './Session.model';
import { OTPVerification } from './OTPVerification.model';
import { Department } from './Department.model';
import { Designation } from './Designation.model';
import { Location } from './Location.model';
import { Staff } from './Staff.model';
import { StaffQualification } from './StaffQualification.model';
import { StaffSkill } from './StaffSkill.model';
import { StaffDocument } from './StaffDocument.model';
import { Shift } from './Shift.model';
import { Attendance } from './Attendance.model';
import { Timesheet } from './Timesheet.model';
import { AttendanceLog } from './AttendanceLog.model';
import { LeaveType } from './LeaveType.model';
import { LeaveBalance } from './LeaveBalance.model';
import { LeaveRequest } from './LeaveRequest.model';
import { Project } from './Project.model';
import { Milestone } from './Milestone.model';
import { Task } from './Task.model';
import { Contact } from './Contact.model';
import { Opportunity } from './Opportunity.model';
import { SalaryStructure } from './SalaryStructure.model';
import { PayrollPeriod } from './PayrollPeriod.model';
import { EmployeeSalary } from './EmployeeSalary.model';
import { Course } from './Course.model';
import { StaffDepartment } from './StaffDepartment.model';
import { JobPosting } from './JobPosting.model';

/**
 * Initialize all Sequelize model associations
 * This file manages all HasMany, BelongsTo, and BelongsToMany relationships
 */
export class AssociationManager {
  public static initializeAssociations(sequelize: Sequelize): void {
    // ======== AUTHENTICATION & SECURITY ========
    
    // User associations
    User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
    User.hasMany(OTPVerification, { foreignKey: 'userId', as: 'otpVerifications' });
    User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
    User.belongsToMany(Permission, { through: UserPermission, foreignKey: 'userId', otherKey: 'permissionId', as: 'permissions' });
    User.hasMany(UserRole, { foreignKey: 'userId', as: 'userRoles' });
    User.hasMany(UserPermission, { foreignKey: 'userId', as: 'userPermissions' });

    // Role associations
    Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions' });
    Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'rolePermissions' });
    Role.hasMany(UserRole, { foreignKey: 'roleId', as: 'userRoles' });

    // Permission associations
    Permission.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'rolePermissions' });
    Permission.hasMany(UserPermission, { foreignKey: 'permissionId', as: 'userPermissions' });

    // Junction tables
    UserRole.belongsTo(User, { foreignKey: 'userId' });
    UserRole.belongsTo(Role, { foreignKey: 'roleId' });
    RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
    RolePermission.belongsTo(Permission, { foreignKey: 'permissionId' });
    UserPermission.belongsTo(User, { foreignKey: 'userId' });
    UserPermission.belongsTo(Permission, { foreignKey: 'permissionId' });

    // Session associations
    Session.belongsTo(User, { foreignKey: 'userId' });

    // OTP associations
    OTPVerification.belongsTo(User, { foreignKey: 'userId' });

    // ======== ORGANIZATIONAL STRUCTURE ========

    // Department associations
    Department.belongsTo(Department, { foreignKey: 'parentDepartmentId', as: 'parentDepartment' });
    Department.hasMany(Department, { foreignKey: 'parentDepartmentId', as: 'childDepartments' });
    Department.belongsTo(User, { foreignKey: 'headUserId', as: 'head' });
    Department.hasMany(Staff, { foreignKey: 'departmentId', as: 'staff' });
    Department.hasMany(Designation, { foreignKey: 'departmentId', as: 'designations' });

    // Designation associations
    Designation.belongsTo(Department, { foreignKey: 'departmentId' });
    Designation.hasMany(Staff, { foreignKey: 'designationId', as: 'staff' });

    // Location associations
    Location.hasMany(Staff, { foreignKey: 'locationId', as: 'staff' });

    // Staff associations
    Staff.belongsTo(User, { foreignKey: 'userId' });
    Staff.belongsTo(Department, { foreignKey: 'departmentId' });
    Staff.belongsToMany(Department, { through: StaffDepartment, foreignKey: 'staffId', otherKey: 'departmentId', as: 'departments' });
    Staff.hasMany(StaffDepartment, { foreignKey: 'staffId', as: 'staffDepartments' });
    Department.belongsToMany(Staff, { through: StaffDepartment, foreignKey: 'departmentId', otherKey: 'staffId', as: 'staffMembers' });
    Department.hasMany(StaffDepartment, { foreignKey: 'departmentId', as: 'staffDepartments' });
    StaffDepartment.belongsTo(Staff, { foreignKey: 'staffId' });
    StaffDepartment.belongsTo(Department, { foreignKey: 'departmentId' });
    Staff.belongsTo(Designation, { foreignKey: 'designationId' });
    Staff.belongsTo(Location, { foreignKey: 'locationId' });
    Staff.belongsTo(Staff, { foreignKey: 'reportingManagerId', as: 'reportingManager' });
    Staff.hasMany(Staff, { foreignKey: 'reportingManagerId', as: 'subordinates' });
    Staff.hasMany(StaffQualification, { foreignKey: 'staffId', as: 'qualifications' });
    Staff.hasMany(StaffSkill, { foreignKey: 'staffId', as: 'skills' });
    Staff.hasMany(StaffDocument, { foreignKey: 'staffId', as: 'documents' });
    Staff.hasMany(Attendance, { foreignKey: 'staffId', as: 'attendanceRecords' });
    Staff.hasMany(Timesheet, { foreignKey: 'staffId', as: 'timesheets' });
    Staff.hasMany(LeaveBalance, { foreignKey: 'staffId', as: 'leaveBalances' });
    Staff.hasMany(LeaveRequest, { foreignKey: 'staffId', as: 'leaveRequests' });
    Staff.hasMany(EmployeeSalary, { foreignKey: 'staffId', as: 'salaries' });
    Staff.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
    Staff.hasMany(Task, { foreignKey: 'reporterId', as: 'reportedTasks' });
    Staff.hasMany(Project, { foreignKey: 'projectManagerId', as: 'managedProjects' });
    Staff.hasMany(Course, { foreignKey: 'instructorId', as: 'instructedCourses' });

    // Staff detail associations
    StaffQualification.belongsTo(Staff, { foreignKey: 'staffId' });
    StaffSkill.belongsTo(Staff, { foreignKey: 'staffId' });
    StaffDocument.belongsTo(Staff, { foreignKey: 'staffId' });

    // ======== ATTENDANCE & TIME TRACKING ========

    // Shift associations
    Shift.belongsTo(Department, { foreignKey: 'departmentId' });
    Shift.hasMany(Attendance, { foreignKey: 'shiftId', as: 'attendanceRecords' });

    // Attendance associations
    Attendance.belongsTo(Staff, { foreignKey: 'staffId' });
    Attendance.belongsTo(Shift, { foreignKey: 'shiftId' });
    Attendance.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
    Attendance.hasMany(AttendanceLog, { foreignKey: 'attendanceId', as: 'logs' });

    // Timesheet associations
    Timesheet.belongsTo(Staff, { foreignKey: 'staffId' });
    Timesheet.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

    // AttendanceLog associations
    AttendanceLog.belongsTo(Attendance, { foreignKey: 'attendanceId' });
    AttendanceLog.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

    // ======== LEAVE MANAGEMENT ========

    // LeaveType associations
    LeaveType.hasMany(LeaveBalance, { foreignKey: 'leaveTypeId', as: 'balances' });
    LeaveType.hasMany(LeaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });

    // LeaveBalance associations
    LeaveBalance.belongsTo(Staff, { foreignKey: 'staffId' });
    LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leaveTypeId' });

    // LeaveRequest associations
    LeaveRequest.belongsTo(Staff, { foreignKey: 'staffId' });
    LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId' });
    LeaveRequest.belongsTo(User, { foreignKey: 'approverUserId', as: 'approver' });

    // ======== PROJECTS & TASKS ========

    // Project associations
    Project.belongsTo(Department, { foreignKey: 'departmentId' });
    Project.belongsTo(Staff, { foreignKey: 'projectManagerId', as: 'projectManager' });
    Project.hasMany(Milestone, { foreignKey: 'projectId', as: 'milestones' });
    Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
    Project.hasMany(Timesheet, { foreignKey: 'projectId', as: 'timesheets' });

    // Milestone associations
    Milestone.belongsTo(Project, { foreignKey: 'projectId' });
    Milestone.hasMany(Task, { foreignKey: 'milestoneId', as: 'tasks' });

    // Task associations
    Task.belongsTo(Project, { foreignKey: 'projectId' });
    Task.belongsTo(Staff, { foreignKey: 'assigneeId', as: 'assignee' });
    Task.belongsTo(Staff, { foreignKey: 'reporterId', as: 'reporter' });
    Task.belongsTo(Task, { foreignKey: 'parentTaskId', as: 'parentTask' });
    Task.hasMany(Task, { foreignKey: 'parentTaskId', as: 'subtasks' });
    Task.belongsTo(Milestone, { foreignKey: 'milestoneId' });

    // ======== CRM ========

    // Contact associations
    Contact.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });
    Contact.hasMany(Opportunity, { foreignKey: 'primaryContactId', as: 'opportunities' });

    // Opportunity associations
    Opportunity.belongsTo(Contact, { foreignKey: 'primaryContactId', as: 'primaryContact' });
    Opportunity.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });

    // ======== PAYROLL & FINANCE ========

    // SalaryStructure associations
    SalaryStructure.belongsTo(Department, { foreignKey: 'departmentId' });
    SalaryStructure.belongsTo(Designation, { foreignKey: 'designationId' });

    // PayrollPeriod associations
    PayrollPeriod.belongsTo(User, { foreignKey: 'processedBy', as: 'processedByUser' });
    PayrollPeriod.belongsTo(User, { foreignKey: 'approvedBy', as: 'approvedByUser' });
    PayrollPeriod.hasMany(EmployeeSalary, { foreignKey: 'payrollPeriodId', as: 'employeeSalaries' });

    // EmployeeSalary associations
    EmployeeSalary.belongsTo(Staff, { foreignKey: 'staffId' });
    EmployeeSalary.belongsTo(PayrollPeriod, { foreignKey: 'payrollPeriodId' });

    // ======== LEARNING MANAGEMENT ========

    // Course associations
    Course.belongsTo(Staff, { foreignKey: 'instructorId', as: 'instructor' });
    Course.belongsTo(Department, { foreignKey: 'departmentId' });
    Course.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

    // ======== RECRUITMENT ========

    // JobPosting associations
    JobPosting.belongsTo(Department, { foreignKey: 'departmentId' });
    JobPosting.belongsTo(Designation, { foreignKey: 'designationId' });
    JobPosting.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  }
}
