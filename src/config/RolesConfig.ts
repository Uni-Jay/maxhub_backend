import { PermissionCode } from './PermissionCodes';

/**
 * RBAC System Roles and Permission Mappings
 */

export enum RoleCode {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  TEAM_LEAD = 'TEAM_LEAD',
  STAFF = 'STAFF',
  CONSULTANT = 'CONSULTANT',
  INTERN = 'INTERN',
}

export const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  [RoleCode.SUPER_ADMIN]: 'Full system access - All permissions granted',
  [RoleCode.ADMIN]: 'Administrative access - System configuration and user management',
  [RoleCode.DEPARTMENT_HEAD]: 'Department leadership - Department-wide oversight',
  [RoleCode.MANAGER]: 'Team management - Team oversight and approvals',
  [RoleCode.SUPERVISOR]: 'Supervision - Direct team member supervision',
  [RoleCode.TEAM_LEAD]: 'Team coordination - Task coordination and guidance',
  [RoleCode.STAFF]: 'Regular employee - Standard operational access',
  [RoleCode.CONSULTANT]: 'External consultant - Limited operational access',
  [RoleCode.INTERN]: 'Intern - Minimal operational access',
};

export const ROLE_HIERARCHY: Record<RoleCode, number> = {
  [RoleCode.SUPER_ADMIN]: 9,
  [RoleCode.ADMIN]: 8,
  [RoleCode.DEPARTMENT_HEAD]: 7,
  [RoleCode.MANAGER]: 6,
  [RoleCode.SUPERVISOR]: 5,
  [RoleCode.TEAM_LEAD]: 4,
  [RoleCode.STAFF]: 3,
  [RoleCode.CONSULTANT]: 2,
  [RoleCode.INTERN]: 1,
};

/**
 * Role-Permission Mappings
 * Each role has explicit permission assignments
 */
export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  [RoleCode.SUPER_ADMIN]: [
    // Full access - all permissions granted
    ...Object.values(PermissionCode),
  ],

  [RoleCode.ADMIN]: [
    // Authentication
    PermissionCode.AUTH_USER_CREATE_ALL,
    PermissionCode.AUTH_USER_READ_ALL,
    PermissionCode.AUTH_USER_UPDATE_ALL,
    PermissionCode.AUTH_USER_DELETE_ALL,
    PermissionCode.AUTH_ROLE_READ_ALL,
    PermissionCode.AUTH_ROLE_UPDATE_ALL,
    PermissionCode.AUTH_PERMISSION_READ_ALL,
    PermissionCode.AUTH_PERMISSION_ASSIGN_ALL,

    // Organizational
    PermissionCode.ORG_DEPARTMENT_CREATE_ALL,
    PermissionCode.ORG_DEPARTMENT_READ_ALL,
    PermissionCode.ORG_DEPARTMENT_UPDATE_ALL,
    PermissionCode.ORG_DEPARTMENT_DELETE_ALL,
    PermissionCode.ORG_DESIGNATION_CREATE_ALL,
    PermissionCode.ORG_DESIGNATION_READ_ALL,
    PermissionCode.ORG_DESIGNATION_UPDATE_ALL,
    PermissionCode.ORG_LOCATION_CREATE_ALL,
    PermissionCode.ORG_LOCATION_READ_ALL,
    PermissionCode.ORG_LOCATION_UPDATE_ALL,
    PermissionCode.ORG_STAFF_CREATE_ALL,
    PermissionCode.ORG_STAFF_READ_ALL,
    PermissionCode.ORG_STAFF_UPDATE_ALL,
    PermissionCode.ORG_STAFF_DELETE_ALL,

    // System
    PermissionCode.SYS_SETTING_READ_ALL,
    PermissionCode.SYS_SETTING_UPDATE_ALL,
    PermissionCode.SYS_AUDIT_READ_ALL,
  ],

  [RoleCode.DEPARTMENT_HEAD]: [
    // Own department and staff management
    PermissionCode.ORG_STAFF_READ_OWN_DEPARTMENT,
    PermissionCode.ORG_STAFF_UPDATE_OWN_DEPARTMENT,
    PermissionCode.ORG_QUALIFICATION_READ_ALL,
    PermissionCode.ORG_SKILL_READ_ALL,

    // Attendance and leave approval
    PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT,
    PermissionCode.ATT_ATTENDANCE_UPDATE_OWN_DEPARTMENT,
    PermissionCode.ATT_TIMESHEET_READ_OWN_DEPARTMENT,
    PermissionCode.ATT_TIMESHEET_APPROVE_OWN_DEPARTMENT,
    PermissionCode.LEAVE_REQUEST_READ_OWN_DEPARTMENT,
    PermissionCode.LEAVE_REQUEST_APPROVE_OWN_DEPARTMENT,
    PermissionCode.LEAVE_REQUEST_REJECT_OWN_DEPARTMENT,

    // Project oversight
    PermissionCode.PROJECT_READ_ALL,
    PermissionCode.PROJECT_UPDATE_ALL,
    PermissionCode.MILESTONE_READ_ALL,
    PermissionCode.TASK_READ_ALL,

    // Team reports
    PermissionCode.SYS_REPORT_GENERATE_ALL,
    PermissionCode.SYS_ANALYTICS_VIEW_ALL,

    // Expense approval
    PermissionCode.EMP_EXPENSE_APPROVE_OWN_DEPARTMENT,
    PermissionCode.EMP_COMPLAINT_ASSIGN_ALL,
  ],

  [RoleCode.MANAGER]: [
    // Read own department staff
    PermissionCode.ORG_STAFF_READ_OWN_DEPARTMENT,

    // Attendance and timesheet approval
    PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT,
    PermissionCode.ATT_TIMESHEET_READ_OWN_DEPARTMENT,
    PermissionCode.ATT_TIMESHEET_APPROVE_OWN_DEPARTMENT,

    // Leave approval
    PermissionCode.LEAVE_REQUEST_READ_OWN_DEPARTMENT,
    PermissionCode.LEAVE_REQUEST_APPROVE_OWN_DEPARTMENT,
    PermissionCode.LEAVE_REQUEST_REJECT_OWN_DEPARTMENT,

    // Project management
    PermissionCode.PROJECT_CREATE_ALL,
    PermissionCode.PROJECT_READ_ALL,
    PermissionCode.PROJECT_UPDATE_ALL,
    PermissionCode.MILESTONE_CREATE_ALL,
    PermissionCode.MILESTONE_READ_ALL,
    PermissionCode.MILESTONE_UPDATE_ALL,
    PermissionCode.TASK_CREATE_ALL,
    PermissionCode.TASK_READ_ALL,
    PermissionCode.TASK_UPDATE_ALL,

    // CRM
    PermissionCode.CRM_OPPORTUNITY_READ_ALL,
    PermissionCode.CRM_QUOTE_CREATE_ALL,
    PermissionCode.CRM_QUOTE_READ_ALL,
    PermissionCode.CRM_QUOTE_APPROVE_ALL,
    PermissionCode.CRM_ORDER_CREATE_ALL,
    PermissionCode.CRM_ORDER_READ_ALL,

    // Appraisal
    PermissionCode.HR_APPRAISAL_CREATE_ALL,
    PermissionCode.HR_APPRAISAL_READ_ALL,
    PermissionCode.HR_APPRAISAL_APPROVE_ALL,

    // Expense approval
    PermissionCode.EMP_EXPENSE_APPROVE_OWN_DEPARTMENT,

    // Team reports
    PermissionCode.SYS_REPORT_GENERATE_ALL,
  ],

  [RoleCode.SUPERVISOR]: [
    // Read own department staff
    PermissionCode.ORG_STAFF_READ_OWN_DEPARTMENT,

    // Attendance
    PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT,
    PermissionCode.ATT_ATTENDANCE_UPDATE_OWN_DEPARTMENT,
    PermissionCode.ATT_TIMESHEET_READ_OWN_DEPARTMENT,

    // Leave
    PermissionCode.LEAVE_REQUEST_READ_OWN_DEPARTMENT,

    // Task assignment
    PermissionCode.TASK_CREATE_ALL,
    PermissionCode.TASK_READ_ALL,
    PermissionCode.TASK_UPDATE_ALL,

    // CRM
    PermissionCode.CRM_ACTIVITY_CREATE_ALL,
    PermissionCode.CRM_ACTIVITY_READ_ALL,
    PermissionCode.CRM_ACTIVITY_UPDATE_ALL,

    // Training
    PermissionCode.TRAIN_ATTENDANCE_MARK_ALL,
  ],

  [RoleCode.TEAM_LEAD]: [
    // Read own info and team
    PermissionCode.ORG_STAFF_READ_OWN_DEPARTMENT,
    PermissionCode.ATT_ATTENDANCE_READ_OWN_DEPARTMENT,

    // Task coordination
    PermissionCode.TASK_READ_ALL,
    PermissionCode.TASK_UPDATE_OWN,

    // Communication
    PermissionCode.COMM_CONVERSATION_CREATE_ALL,
    PermissionCode.COMM_CONVERSATION_READ_ALL,
    PermissionCode.COMM_MESSAGE_CREATE_ALL,
    PermissionCode.COMM_MESSAGE_READ_ALL,

    // Own info
    PermissionCode.AUTH_USER_READ_OWN,
    PermissionCode.AUTH_USER_UPDATE_OWN,
    PermissionCode.ORG_STAFF_READ_OWN,
    PermissionCode.ORG_QUALIFICATION_READ_OWN,
    PermissionCode.ORG_SKILL_READ_OWN,

    // Leave
    PermissionCode.LEAVE_REQUEST_CREATE_OWN,
    PermissionCode.LEAVE_REQUEST_READ_OWN,

    // Feedback
    PermissionCode.HR_FEEDBACK_CREATE_ALL,
    PermissionCode.HR_FEEDBACK_READ_OWN,
  ],

  [RoleCode.STAFF]: [
    // Own information
    PermissionCode.AUTH_USER_READ_OWN,
    PermissionCode.AUTH_USER_UPDATE_OWN,
    PermissionCode.ORG_STAFF_READ_OWN,
    PermissionCode.ORG_QUALIFICATION_READ_OWN,
    PermissionCode.ORG_SKILL_READ_OWN,

    // Attendance and timesheet
    PermissionCode.ATT_ATTENDANCE_CREATE_OWN,
    PermissionCode.ATT_TIMESHEET_CREATE_OWN,
    PermissionCode.ATT_ATTENDANCE_READ_OWN,
    PermissionCode.ATT_TIMESHEET_READ_OWN,

    // Leave
    PermissionCode.LEAVE_REQUEST_CREATE_OWN,
    PermissionCode.LEAVE_REQUEST_READ_OWN,
    PermissionCode.LEAVE_TYPE_READ_ALL,

    // Task
    PermissionCode.TASK_READ_OWN,

    // Project
    PermissionCode.PROJECT_READ_OWN,

    // CRM - read only
    PermissionCode.CRM_CONTACT_READ_ALL,
    PermissionCode.CRM_OPPORTUNITY_READ_OWN,
    PermissionCode.CRM_ACTIVITY_READ_OWN,

    // Learning
    PermissionCode.LMS_COURSE_READ_ALL,
    PermissionCode.LMS_ENROLLMENT_READ_OWN,
    PermissionCode.LMS_EXAM_READ_OWN,
    PermissionCode.LMS_EXAM_ATTEMPT_OWN,
    PermissionCode.LMS_CERTIFICATE_READ_OWN,

    // Communication
    PermissionCode.COMM_CONVERSATION_CREATE_ALL,
    PermissionCode.COMM_CONVERSATION_READ_OWN,
    PermissionCode.COMM_MESSAGE_CREATE_ALL,
    PermissionCode.COMM_MESSAGE_READ_OWN,
    PermissionCode.COMM_NOTIFICATION_READ_OWN,
    PermissionCode.COMM_NOTIFICATION_DELETE_OWN,

    // Payroll
    PermissionCode.PAY_SALARY_READ_OWN,

    // Expenses
    PermissionCode.EMP_EXPENSE_CREATE_OWN,
    PermissionCode.EMP_EXPENSE_READ_OWN,

    // Goals and appraisal
    PermissionCode.HR_GOAL_READ_OWN,
    PermissionCode.HR_GOAL_UPDATE_OWN,
    PermissionCode.HR_APPRAISAL_READ_OWN,
    PermissionCode.HR_APPRAISAL_SUBMIT_OWN,
    PermissionCode.HR_FEEDBACK_READ_OWN,
    PermissionCode.HR_FEEDBACK_ACKNOWLEDGE_OWN,

    // Training
    PermissionCode.TRAIN_ATTENDANCE_READ_OWN,

    // Complaints
    PermissionCode.EMP_COMPLAINT_CREATE_OWN,
    PermissionCode.EMP_COMPLAINT_READ_OWN,

    // Surveys
    PermissionCode.SURVEY_RESPOND_ALL,

    // Audit
    PermissionCode.SYS_AUDIT_READ_OWN,
  ],

  [RoleCode.CONSULTANT]: [
    // Limited access
    PermissionCode.AUTH_USER_READ_OWN,
    PermissionCode.ORG_STAFF_READ_OWN,
    PermissionCode.PROJECT_READ_OWN,
    PermissionCode.TASK_READ_OWN,
    PermissionCode.COMM_CONVERSATION_READ_OWN,
    PermissionCode.COMM_MESSAGE_CREATE_ALL,
    PermissionCode.COMM_MESSAGE_READ_OWN,
    PermissionCode.CRM_CONTACT_READ_ALL,
    PermissionCode.CRM_OPPORTUNITY_READ_OWN,
    PermissionCode.CRM_ACTIVITY_READ_OWN,
    PermissionCode.SURVEY_RESPOND_ALL,
  ],

  [RoleCode.INTERN]: [
    // Minimal access
    PermissionCode.AUTH_USER_READ_OWN,
    PermissionCode.ORG_STAFF_READ_OWN,
    PermissionCode.PROJECT_READ_OWN,
    PermissionCode.TASK_READ_OWN,
    PermissionCode.LMS_COURSE_READ_ALL,
    PermissionCode.LMS_ENROLLMENT_READ_OWN,
    PermissionCode.COMM_CONVERSATION_READ_OWN,
    PermissionCode.COMM_MESSAGE_CREATE_ALL,
    PermissionCode.COMM_MESSAGE_READ_OWN,
    PermissionCode.SURVEY_RESPOND_ALL,
  ],
};
