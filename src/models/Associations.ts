import { DataTypes, Model, Sequelize } from 'sequelize';
import { Conversation } from './Conversation.model';
import { ConversationParticipant } from './ConversationParticipant.model';
import { Message } from './Message.model';
import { MessageRead } from './MessageRead.model';
import { Branch } from './Branch.model';
import { Unit } from './Unit.model';
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
import { Overtime } from './Overtime.model';
import { Timesheet } from './Timesheet.model';
import { AttendanceLog } from './AttendanceLog.model';
import { LeaveType } from './LeaveType.model';
import { LeaveBalance } from './LeaveBalance.model';
import { LeaveRequest } from './LeaveRequest.model';
import { Project } from './Project.model';
import { Milestone } from './Milestone.model';
import { Task } from './Task.model';
import { ProjectComment } from './ProjectComment.model';
import { Contact } from './Contact.model';
import { Opportunity } from './Opportunity.model';
import { SalaryStructure } from './SalaryStructure.model';
import { PayrollPeriod } from './PayrollPeriod.model';
import { EmployeeSalary } from './EmployeeSalary.model';
import { Course } from './Course.model';
import { StaffDepartment } from './StaffDepartment.model';
import { Meeting } from './Meeting.model';
import { MeetingParticipant } from './MeetingParticipant.model';
import { Call } from './Call.model';
import { JobPosting } from './JobPosting.model';
import { Company } from './Company.model';
import { Program } from './Program.model';
import { StudentProfile } from './StudentProfile.model';
import { StudentEnrollment } from './StudentEnrollment.model';
import { StudentResult } from './StudentResult.model';
import { StudentAttendance } from './StudentAttendance.model';
import { ClassSchedule } from './ClassSchedule.model';
import { AppModule } from './Module.model';
import { UserModulePermission } from './UserModulePermission.model';
import { Enrollment } from './Enrollment.model';
import { CourseModule } from './CourseModule.model';
import { CourseContent } from './CourseContent.model';
import { Exam } from './Exam.model';
import { Question } from './Question.model';
import { ExamResult } from './ExamResult.model';
import { Certificate } from './Certificate.model';
import { FeeReceipt } from './FeeReceipt.model';
import { Appraisal } from './Appraisal.model';
import { EmployeePromotion } from './EmployeePromotion.model';
import { TrainingAttendance } from './TrainingAttendance.model';
import { InventoryCategory } from './InventoryCategory.model';
import { InventoryItem } from './InventoryItem.model';
import { WarehouseStock } from './WarehouseStock.model';
import { Supplier } from './Supplier.model';
import { PurchaseOrder } from './PurchaseOrder.model';
import { JobApplication } from './JobApplication.model';
import { JobSyncLog } from './JobSyncLog.model';
import { WeeklyReport } from './WeeklyReport.model';
import { Customer } from './Customer.model';
import { OrderTracking } from './OrderTracking.model';
import { Invoice } from './Invoice.model';
import { Client } from './Client.model';
import { Quote } from './Quote.model';
import { AIConversation } from '../modules/ai/models/AIConversation.model';
import { AIMessage } from '../modules/ai/models/AIMessage.model';
import { AIMeetingSummary } from '../modules/ai/models/AIMeetingSummary.model';
import { AIReminder } from '../modules/ai/models/AIReminder.model';

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

    // ======== BRANCH & UNIT STRUCTURE ========

    Branch.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
    Branch.hasMany(Department, { foreignKey: 'branchId', as: 'departments' });
    Branch.hasMany(Unit, { foreignKey: 'branchId', as: 'units' });
    Branch.hasMany(Staff, { foreignKey: 'branchId', as: 'staff' });

    Unit.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
    Unit.belongsTo(User, { foreignKey: 'headUserId', as: 'head' });
    Unit.hasMany(Staff, { foreignKey: 'unitId', as: 'staff' });

    Staff.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
    Staff.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });
    Department.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

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
    Staff.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
    Staff.belongsToMany(Department, { through: StaffDepartment, foreignKey: 'staffId', otherKey: 'departmentId', as: 'departments' });
    Staff.hasMany(StaffDepartment, { foreignKey: 'staffId', as: 'staffDepartments' });
    Department.belongsToMany(Staff, { through: StaffDepartment, foreignKey: 'departmentId', otherKey: 'staffId', as: 'staffMembers' });
    Department.hasMany(StaffDepartment, { foreignKey: 'departmentId', as: 'staffDepartments' });
    StaffDepartment.belongsTo(Staff, { foreignKey: 'staffId' });
    StaffDepartment.belongsTo(Department, { foreignKey: 'departmentId' });
    Staff.belongsTo(Designation, { foreignKey: 'designationId', as: 'designation' });
    Staff.belongsTo(Location, { foreignKey: 'locationId' });
    Staff.belongsTo(Staff, { foreignKey: 'reportingManagerId', as: 'reportingManager' });
    Staff.hasMany(Staff, { foreignKey: 'reportingManagerId', as: 'subordinates' });
    Staff.hasMany(StaffQualification, { foreignKey: 'staffId', as: 'qualifications' });
    Staff.hasMany(StaffSkill, { foreignKey: 'staffId', as: 'staffSkills' });
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
    Attendance.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    Attendance.belongsTo(Shift, { foreignKey: 'shiftId' });
    Attendance.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
    Overtime.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    Overtime.belongsTo(Attendance, { foreignKey: 'attendanceId', as: 'attendance' });
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
    LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

    // LeaveRequest associations
    LeaveRequest.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });
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
    Task.hasMany(ProjectComment, { foreignKey: 'taskId', as: 'comments' });

    // ProjectComment associations
    ProjectComment.belongsTo(Task, { foreignKey: 'taskId' });
    ProjectComment.belongsTo(Project, { foreignKey: 'projectId' });
    ProjectComment.belongsTo(Staff, { foreignKey: 'staffId', as: 'author' });
    Project.hasMany(ProjectComment, { foreignKey: 'projectId', as: 'comments' });

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
    Course.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
    Course.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
    Course.hasMany(CourseModule, { foreignKey: 'courseId', as: 'modules' });
    Course.hasMany(Exam, { foreignKey: 'courseId', as: 'exams' });
    CourseModule.hasMany(CourseContent, { foreignKey: 'moduleId', as: 'contents' });
    Exam.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Exam.hasMany(Question, { foreignKey: 'examId', as: 'questions' });
    Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    Enrollment.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    ExamResult.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });
    Certificate.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });
    FeeReceipt.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });
    FeeReceipt.belongsTo(User, { foreignKey: 'issuedById', as: 'issuedBy' });

    // ======== INVOICES & PROPOSALS (CRM customer billing) ========
    Invoice.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
    Invoice.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
    Invoice.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
    Quote.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
    Quote.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
    Quote.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });
    Quote.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

    // ======== RECRUITMENT ========

    // JobPosting associations
    JobPosting.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
    JobPosting.belongsTo(Designation, { foreignKey: 'designationId', as: 'designation' });
    JobPosting.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
    JobApplication.belongsTo(JobPosting, { foreignKey: 'jobPostingId', as: 'jobPosting' });
    JobPosting.hasMany(JobSyncLog, { foreignKey: 'jobPostingId', as: 'syncLogs' });
    JobSyncLog.belongsTo(JobPosting, { foreignKey: 'jobPostingId', as: 'jobPosting' });

    // ======== WEEKLY REPORTS ========
    WeeklyReport.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    Staff.hasMany(WeeklyReport, { foreignKey: 'staffId', as: 'weeklyReports' });
    WeeklyReport.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

    // ======== BEADMAX SALES ========
    OrderTracking.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
    Customer.hasMany(OrderTracking, { foreignKey: 'customerId', as: 'orders' });

    // ======== AI ASSISTANT ========
    AIConversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    AIConversation.hasMany(AIMessage, { foreignKey: 'conversationId', as: 'messages' });
    AIMessage.belongsTo(AIConversation, { foreignKey: 'conversationId', as: 'conversation' });
    AIMeetingSummary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    AIReminder.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    // ======== PERFORMANCE & TRAINING ========
    Appraisal.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    TrainingAttendance.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });

    // ======== PROMOTIONS ========
    EmployeePromotion.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    EmployeePromotion.belongsTo(Designation, { foreignKey: 'fromDesignationId', as: 'fromDesignation' });
    EmployeePromotion.belongsTo(Designation, { foreignKey: 'toDesignationId', as: 'toDesignation' });
    EmployeePromotion.belongsTo(Department, { foreignKey: 'fromDepartmentId', as: 'fromDepartment' });
    EmployeePromotion.belongsTo(Department, { foreignKey: 'toDepartmentId', as: 'toDepartment' });

    // ======== PAYROLL ========
    EmployeeSalary.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
    EmployeeSalary.belongsTo(PayrollPeriod, { foreignKey: 'payrollPeriodId', as: 'payrollPeriod' });

    // ======== INVENTORY ========
    InventoryItem.belongsTo(InventoryCategory, { foreignKey: 'categoryId', as: 'category' });
    WarehouseStock.belongsTo(InventoryItem, { foreignKey: 'itemId', as: 'item' });
    PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

    // ======== STUDENT MANAGEMENT SYSTEM ========

    // Company associations
    Company.hasMany(Program, { foreignKey: 'companyId', as: 'programs' });
    Company.hasMany(StudentProfile, { foreignKey: 'companyId', as: 'students' });

    // Program associations
    Program.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
    Program.hasMany(StudentProfile, { foreignKey: 'programId', as: 'students' });

    // User → StudentProfile (one-to-one)
    User.hasOne(StudentProfile, { foreignKey: 'userId', as: 'studentProfile' });
    StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    StudentProfile.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
    StudentProfile.belongsTo(Program, { foreignKey: 'programId', as: 'program' });
    StudentProfile.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

    // StudentProfile → Enrollments
    StudentProfile.hasMany(StudentEnrollment, { foreignKey: 'studentId', as: 'enrollments' });
    StudentEnrollment.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student' });
    StudentEnrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    StudentEnrollment.belongsTo(User, { foreignKey: 'enrolledById', as: 'enrolledBy' });
    Course.hasMany(StudentEnrollment, { foreignKey: 'courseId', as: 'studentEnrollments' });

    // StudentProfile → Results
    StudentProfile.hasMany(StudentResult, { foreignKey: 'studentId', as: 'results' });
    StudentResult.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student' });
    StudentResult.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    StudentResult.belongsTo(User, { foreignKey: 'gradedById', as: 'gradedBy' });
    Course.hasMany(StudentResult, { foreignKey: 'courseId', as: 'studentResults' });

    // StudentProfile → Attendance
    StudentProfile.hasMany(StudentAttendance, { foreignKey: 'studentId', as: 'attendanceRecords' });
    StudentAttendance.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student' });
    StudentAttendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    StudentAttendance.belongsTo(User, { foreignKey: 'markedById', as: 'markedBy' });
    Course.hasMany(StudentAttendance, { foreignKey: 'courseId', as: 'studentAttendance' });

    // ClassSchedule associations
    ClassSchedule.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    ClassSchedule.belongsTo(Staff, { foreignKey: 'instructorStaffId', as: 'instructor' });
    Course.hasMany(ClassSchedule, { foreignKey: 'courseId', as: 'schedules' });

    // ======== MEETINGS & CALLS ========
    Meeting.belongsTo(User, { foreignKey: 'hostUserId', as: 'host' });
    User.hasMany(Meeting, { foreignKey: 'hostUserId', as: 'hostedMeetings' });
    Meeting.hasMany(MeetingParticipant, { foreignKey: 'meetingId', as: 'participants' });
    MeetingParticipant.belongsTo(Meeting, { foreignKey: 'meetingId' });
    MeetingParticipant.belongsTo(User, { foreignKey: 'userId' });
    User.hasMany(MeetingParticipant, { foreignKey: 'userId', as: 'meetingParticipations' });

    Call.belongsTo(User, { foreignKey: 'callerUserId', as: 'caller' });
    Call.belongsTo(User, { foreignKey: 'calleeUserId', as: 'callee' });
    User.hasMany(Call, { foreignKey: 'callerUserId', as: 'outgoingCalls' });
    User.hasMany(Call, { foreignKey: 'calleeUserId', as: 'incomingCalls' });

    // ======== MESSAGING ========
    Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
    Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
    Message.belongsTo(User, { foreignKey: 'senderUserId', as: 'sender' });
    User.hasMany(Message, { foreignKey: 'senderUserId', as: 'sentMessages' });
    Message.belongsTo(Message, { foreignKey: 'replyToMessageId', as: 'replyTo' });
    Message.hasMany(MessageRead, { foreignKey: 'messageId', as: 'reads' });
    MessageRead.belongsTo(Message, { foreignKey: 'messageId' });
    MessageRead.belongsTo(User, { foreignKey: 'userId' });
    Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
    ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversationId' });
    ConversationParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(ConversationParticipant, { foreignKey: 'userId', as: 'conversationParticipations' });

    // ======== MODULE PERMISSIONS ========
    User.hasMany(UserModulePermission, { foreignKey: 'userId', as: 'modulePermissions' });
    UserModulePermission.belongsTo(User, { foreignKey: 'userId' });
    AppModule.hasMany(UserModulePermission, { foreignKey: 'moduleCode', sourceKey: 'code', as: 'userOverrides' });
    UserModulePermission.belongsTo(AppModule, { foreignKey: 'moduleCode', targetKey: 'code', as: 'module' });
  }
}
