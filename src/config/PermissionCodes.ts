/**
 * RBAC Permission Codes - Centralized Permission Definitions
 * Format: module.resource.action.scope
 */

export enum PermissionCode {
  // ==================== AUTHENTICATION ====================
  AUTH_USER_CREATE_ALL = 'auth.user.create.all',
  AUTH_USER_READ_ALL = 'auth.user.read.all',
  AUTH_USER_READ_OWN = 'auth.user.read.own',
  AUTH_USER_UPDATE_ALL = 'auth.user.update.all',
  AUTH_USER_UPDATE_OWN = 'auth.user.update.own',
  AUTH_USER_DELETE_ALL = 'auth.user.delete.all',
  AUTH_USER_DELETE_OWN = 'auth.user.delete.own',

  AUTH_ROLE_CREATE_ALL = 'auth.role.create.all',
  AUTH_ROLE_READ_ALL = 'auth.role.read.all',
  AUTH_ROLE_UPDATE_ALL = 'auth.role.update.all',
  AUTH_ROLE_DELETE_ALL = 'auth.role.delete.all',

  AUTH_PERMISSION_READ_ALL = 'auth.permission.read.all',
  AUTH_PERMISSION_ASSIGN_ALL = 'auth.permission.assign.all',

  AUTH_SESSION_REVOKE_ALL = 'auth.session.revoke.all',
  AUTH_SESSION_REVOKE_OWN = 'auth.session.revoke.own',

  // ==================== ORGANIZATIONAL ====================
  ORG_DEPARTMENT_CREATE_ALL = 'org.department.create.all',
  ORG_DEPARTMENT_READ_ALL = 'org.department.read.all',
  ORG_DEPARTMENT_READ_OWN_DEPARTMENT = 'org.department.read.own_department',
  ORG_DEPARTMENT_UPDATE_ALL = 'org.department.update.all',
  ORG_DEPARTMENT_UPDATE_OWN_DEPARTMENT = 'org.department.update.own_department',
  ORG_DEPARTMENT_DELETE_ALL = 'org.department.delete.all',

  ORG_DESIGNATION_CREATE_ALL = 'org.designation.create.all',
  ORG_DESIGNATION_READ_ALL = 'org.designation.read.all',
  ORG_DESIGNATION_UPDATE_ALL = 'org.designation.update.all',
  ORG_DESIGNATION_DELETE_ALL = 'org.designation.delete.all',

  ORG_LOCATION_CREATE_ALL = 'org.location.create.all',
  ORG_LOCATION_READ_ALL = 'org.location.read.all',
  ORG_LOCATION_UPDATE_ALL = 'org.location.update.all',
  ORG_LOCATION_DELETE_ALL = 'org.location.delete.all',

  ORG_STAFF_CREATE_ALL = 'org.staff.create.all',
  ORG_STAFF_READ_ALL = 'org.staff.read.all',
  ORG_STAFF_READ_OWN = 'org.staff.read.own',
  ORG_STAFF_READ_OWN_DEPARTMENT = 'org.staff.read.own_department',
  ORG_STAFF_UPDATE_ALL = 'org.staff.update.all',
  ORG_STAFF_UPDATE_OWN = 'org.staff.update.own',
  ORG_STAFF_UPDATE_OWN_DEPARTMENT = 'org.staff.update.own_department',
  ORG_STAFF_DELETE_ALL = 'org.staff.delete.all',

  ORG_QUALIFICATION_CREATE_ALL = 'org.qualification.create.all',
  ORG_QUALIFICATION_READ_ALL = 'org.qualification.read.all',
  ORG_QUALIFICATION_READ_OWN = 'org.qualification.read.own',
  ORG_QUALIFICATION_UPDATE_ALL = 'org.qualification.update.all',
  ORG_QUALIFICATION_UPDATE_OWN = 'org.qualification.update.own',
  ORG_QUALIFICATION_DELETE_ALL = 'org.qualification.delete.all',

  ORG_SKILL_CREATE_ALL = 'org.skill.create.all',
  ORG_SKILL_READ_ALL = 'org.skill.read.all',
  ORG_SKILL_READ_OWN = 'org.skill.read.own',
  ORG_SKILL_UPDATE_ALL = 'org.skill.update.all',
  ORG_SKILL_UPDATE_OWN = 'org.skill.update.own',
  ORG_SKILL_DELETE_ALL = 'org.skill.delete.all',

  // ==================== ATTENDANCE & TIME ====================
  ATT_SHIFT_CREATE_ALL = 'att.shift.create.all',
  ATT_SHIFT_READ_ALL = 'att.shift.read.all',
  ATT_SHIFT_UPDATE_ALL = 'att.shift.update.all',
  ATT_SHIFT_DELETE_ALL = 'att.shift.delete.all',

  ATT_ATTENDANCE_CREATE_OWN = 'att.attendance.create.own',
  ATT_ATTENDANCE_READ_ALL = 'att.attendance.read.all',
  ATT_ATTENDANCE_READ_OWN = 'att.attendance.read.own',
  ATT_ATTENDANCE_READ_OWN_DEPARTMENT = 'att.attendance.read.own_department',
  ATT_ATTENDANCE_UPDATE_ALL = 'att.attendance.update.all',
  ATT_ATTENDANCE_UPDATE_OWN_DEPARTMENT = 'att.attendance.update.own_department',
  ATT_ATTENDANCE_DELETE_ALL = 'att.attendance.delete.all',

  ATT_TIMESHEET_CREATE_OWN = 'att.timesheet.create.own',
  ATT_TIMESHEET_READ_ALL = 'att.timesheet.read.all',
  ATT_TIMESHEET_READ_OWN = 'att.timesheet.read.own',
  ATT_TIMESHEET_READ_OWN_DEPARTMENT = 'att.timesheet.read.own_department',
  ATT_TIMESHEET_APPROVE_ALL = 'att.timesheet.approve.all',
  ATT_TIMESHEET_APPROVE_OWN_DEPARTMENT = 'att.timesheet.approve.own_department',

  // ==================== LEAVE MANAGEMENT ====================
  LEAVE_TYPE_CREATE_ALL = 'leave.type.create.all',
  LEAVE_TYPE_READ_ALL = 'leave.type.read.all',
  LEAVE_TYPE_UPDATE_ALL = 'leave.type.update.all',
  LEAVE_TYPE_DELETE_ALL = 'leave.type.delete.all',

  LEAVE_REQUEST_CREATE_OWN = 'leave.request.create.own',
  LEAVE_REQUEST_READ_ALL = 'leave.request.read.all',
  LEAVE_REQUEST_READ_OWN = 'leave.request.read.own',
  LEAVE_REQUEST_READ_OWN_DEPARTMENT = 'leave.request.read.own_department',
  LEAVE_REQUEST_APPROVE_ALL = 'leave.request.approve.all',
  LEAVE_REQUEST_APPROVE_OWN_DEPARTMENT = 'leave.request.approve.own_department',
  LEAVE_REQUEST_REJECT_ALL = 'leave.request.reject.all',
  LEAVE_REQUEST_REJECT_OWN_DEPARTMENT = 'leave.request.reject.own_department',

  // ==================== PROJECT MANAGEMENT ====================
  PROJECT_CREATE_ALL = 'project.create.all',
  PROJECT_READ_ALL = 'project.read.all',
  PROJECT_READ_OWN = 'project.read.own',
  PROJECT_UPDATE_ALL = 'project.update.all',
  PROJECT_UPDATE_OWN = 'project.update.own',
  PROJECT_DELETE_ALL = 'project.delete.all',

  MILESTONE_CREATE_ALL = 'milestone.create.all',
  MILESTONE_READ_ALL = 'milestone.read.all',
  MILESTONE_READ_OWN = 'milestone.read.own',
  MILESTONE_UPDATE_ALL = 'milestone.update.all',
  MILESTONE_UPDATE_OWN = 'milestone.update.own',
  MILESTONE_DELETE_ALL = 'milestone.delete.all',

  TASK_CREATE_ALL = 'task.create.all',
  TASK_READ_ALL = 'task.read.all',
  TASK_READ_OWN = 'task.read.own',
  TASK_UPDATE_ALL = 'task.update.all',
  TASK_UPDATE_OWN = 'task.update.own',
  TASK_DELETE_ALL = 'task.delete.all',

  PROJECT_NOTE_CREATE_ALL = 'projectnote.create.all',
  PROJECT_NOTE_READ_ALL = 'projectnote.read.all',
  PROJECT_NOTE_DELETE_ALL = 'projectnote.delete.all',

  // ==================== CRM & SALES ====================
  CRM_CONTACT_CREATE_ALL = 'crm.contact.create.all',
  CRM_CONTACT_READ_ALL = 'crm.contact.read.all',
  CRM_CONTACT_READ_OWN = 'crm.contact.read.own',
  CRM_CONTACT_UPDATE_ALL = 'crm.contact.update.all',
  CRM_CONTACT_UPDATE_OWN = 'crm.contact.update.own',
  CRM_CONTACT_DELETE_ALL = 'crm.contact.delete.all',

  CRM_ACCOUNT_CREATE_ALL = 'crm.account.create.all',
  CRM_ACCOUNT_READ_ALL = 'crm.account.read.all',
  CRM_ACCOUNT_READ_OWN = 'crm.account.read.own',
  CRM_ACCOUNT_UPDATE_ALL = 'crm.account.update.all',
  CRM_ACCOUNT_UPDATE_OWN = 'crm.account.update.own',
  CRM_ACCOUNT_DELETE_ALL = 'crm.account.delete.all',

  CRM_OPPORTUNITY_CREATE_ALL = 'crm.opportunity.create.all',
  CRM_OPPORTUNITY_READ_ALL = 'crm.opportunity.read.all',
  CRM_OPPORTUNITY_READ_OWN = 'crm.opportunity.read.own',
  CRM_OPPORTUNITY_UPDATE_ALL = 'crm.opportunity.update.all',
  CRM_OPPORTUNITY_UPDATE_OWN = 'crm.opportunity.update.own',
  CRM_OPPORTUNITY_DELETE_ALL = 'crm.opportunity.delete.all',

  CRM_ACTIVITY_CREATE_ALL = 'crm.activity.create.all',
  CRM_ACTIVITY_READ_ALL = 'crm.activity.read.all',
  CRM_ACTIVITY_READ_OWN = 'crm.activity.read.own',
  CRM_ACTIVITY_UPDATE_ALL = 'crm.activity.update.all',
  CRM_ACTIVITY_UPDATE_OWN = 'crm.activity.update.own',
  CRM_ACTIVITY_DELETE_ALL = 'crm.activity.delete.all',

  CRM_QUOTE_CREATE_ALL = 'crm.quote.create.all',
  CRM_QUOTE_READ_ALL = 'crm.quote.read.all',
  CRM_QUOTE_READ_OWN = 'crm.quote.read.own',
  CRM_QUOTE_APPROVE_ALL = 'crm.quote.approve.all',
  CRM_QUOTE_DELETE_ALL = 'crm.quote.delete.all',

  CRM_ORDER_CREATE_ALL = 'crm.order.create.all',
  CRM_ORDER_READ_ALL = 'crm.order.read.all',
  CRM_ORDER_READ_OWN = 'crm.order.read.own',
  CRM_ORDER_UPDATE_ALL = 'crm.order.update.all',
  CRM_ORDER_UPDATE_OWN = 'crm.order.update.own',
  CRM_ORDER_DELETE_ALL = 'crm.order.delete.all',

  // ==================== LEARNING & DEVELOPMENT ====================
  LMS_COURSE_CREATE_ALL = 'lms.course.create.all',
  LMS_COURSE_READ_ALL = 'lms.course.read.all',
  LMS_COURSE_UPDATE_ALL = 'lms.course.update.all',
  LMS_COURSE_DELETE_ALL = 'lms.course.delete.all',

  LMS_ENROLLMENT_CREATE_ALL = 'lms.enrollment.create.all',
  LMS_ENROLLMENT_READ_ALL = 'lms.enrollment.read.all',
  LMS_ENROLLMENT_READ_OWN = 'lms.enrollment.read.own',
  LMS_ENROLLMENT_DELETE_ALL = 'lms.enrollment.delete.all',

  LMS_EXAM_CREATE_ALL = 'lms.exam.create.all',
  LMS_EXAM_READ_ALL = 'lms.exam.read.all',
  LMS_EXAM_READ_OWN = 'lms.exam.read.own',
  LMS_EXAM_ATTEMPT_OWN = 'lms.exam.attempt.own',
  LMS_EXAM_DELETE_ALL = 'lms.exam.delete.all',

  LMS_CERTIFICATE_READ_ALL = 'lms.certificate.read.all',
  LMS_CERTIFICATE_READ_OWN = 'lms.certificate.read.own',
  LMS_CERTIFICATE_ISSUE_ALL = 'lms.certificate.issue.all',

  // ==================== RECRUITMENT ====================
  REC_POSTING_CREATE_ALL = 'rec.posting.create.all',
  REC_POSTING_READ_ALL = 'rec.posting.read.all',
  REC_POSTING_UPDATE_ALL = 'rec.posting.update.all',
  REC_POSTING_DELETE_ALL = 'rec.posting.delete.all',
  REC_POSTING_PUBLISH_ALL = 'rec.posting.publish.all',

  REC_APPLICATION_CREATE_ALL = 'rec.application.create.all',
  REC_APPLICATION_READ_ALL = 'rec.application.read.all',
  REC_APPLICATION_UPDATE_ALL = 'rec.application.update.all',
  REC_APPLICATION_DELETE_ALL = 'rec.application.delete.all',

  REC_INTERVIEW_CREATE_ALL = 'rec.interview.create.all',
  REC_INTERVIEW_READ_ALL = 'rec.interview.read.all',
  REC_INTERVIEW_UPDATE_ALL = 'rec.interview.update.all',
  REC_INTERVIEW_DELETE_ALL = 'rec.interview.delete.all',

  REC_OFFER_CREATE_ALL = 'rec.offer.create.all',
  REC_OFFER_READ_ALL = 'rec.offer.read.all',
  REC_OFFER_APPROVE_ALL = 'rec.offer.approve.all',
  REC_OFFER_DELETE_ALL = 'rec.offer.delete.all',

  REC_ONBOARDING_READ_ALL = 'rec.onboarding.read.all',
  REC_ONBOARDING_READ_OWN = 'rec.onboarding.read.own',
  REC_ONBOARDING_UPDATE_ALL = 'rec.onboarding.update.all',

  // ==================== COMMUNICATION ====================
  COMM_CONVERSATION_CREATE_ALL = 'comm.conversation.create.all',
  COMM_CONVERSATION_READ_ALL = 'comm.conversation.read.all',
  COMM_CONVERSATION_READ_OWN = 'comm.conversation.read.own',
  COMM_CONVERSATION_DELETE_ALL = 'comm.conversation.delete.all',

  COMM_MESSAGE_CREATE_ALL = 'comm.message.create.all',
  COMM_MESSAGE_READ_ALL = 'comm.message.read.all',
  COMM_MESSAGE_READ_OWN = 'comm.message.read.own',
  COMM_MESSAGE_DELETE_ALL = 'comm.message.delete.all',

  COMM_NOTIFICATION_READ_OWN = 'comm.notification.read.own',
  COMM_NOTIFICATION_DELETE_OWN = 'comm.notification.delete.own',

  // ==================== PAYROLL & ACCOUNTING ====================
  PAY_STRUCTURE_CREATE_ALL = 'pay.structure.create.all',
  PAY_STRUCTURE_READ_ALL = 'pay.structure.read.all',
  PAY_STRUCTURE_UPDATE_ALL = 'pay.structure.update.all',
  PAY_STRUCTURE_DELETE_ALL = 'pay.structure.delete.all',

  PAY_PERIOD_CREATE_ALL = 'pay.period.create.all',
  PAY_PERIOD_READ_ALL = 'pay.period.read.all',
  PAY_PERIOD_PROCESS_ALL = 'pay.period.process.all',
  PAY_PERIOD_DELETE_ALL = 'pay.period.delete.all',

  PAY_SALARY_READ_ALL = 'pay.salary.read.all',
  PAY_SALARY_READ_OWN = 'pay.salary.read.own',
  PAY_SALARY_APPROVE_ALL = 'pay.salary.approve.all',

  ACC_CHARTOFACCOUNTS_CREATE_ALL = 'acc.chartofaccounts.create.all',
  ACC_CHARTOFACCOUNTS_READ_ALL = 'acc.chartofaccounts.read.all',
  ACC_CHARTOFACCOUNTS_UPDATE_ALL = 'acc.chartofaccounts.update.all',
  ACC_CHARTOFACCOUNTS_DELETE_ALL = 'acc.chartofaccounts.delete.all',

  ACC_JOURNALENTRY_CREATE_ALL = 'acc.journalentry.create.all',
  ACC_JOURNALENTRY_READ_ALL = 'acc.journalentry.read.all',
  ACC_JOURNALENTRY_POST_ALL = 'acc.journalentry.post.all',
  ACC_JOURNALENTRY_DELETE_ALL = 'acc.journalentry.delete.all',

  ACC_INVOICE_CREATE_ALL = 'acc.invoice.create.all',
  ACC_INVOICE_READ_ALL = 'acc.invoice.read.all',
  ACC_INVOICE_READ_OWN = 'acc.invoice.read.own',
  ACC_INVOICE_UPDATE_ALL = 'acc.invoice.update.all',
  ACC_INVOICE_DELETE_ALL = 'acc.invoice.delete.all',

  ACC_PAYMENT_CREATE_ALL = 'acc.payment.create.all',
  ACC_PAYMENT_READ_ALL = 'acc.payment.read.all',
  ACC_PAYMENT_PROCESS_ALL = 'acc.payment.process.all',
  ACC_PAYMENT_DELETE_ALL = 'acc.payment.delete.all',

  // ==================== INVENTORY ====================
  INV_CATEGORY_CREATE_ALL = 'inv.category.create.all',
  INV_CATEGORY_READ_ALL = 'inv.category.read.all',
  INV_CATEGORY_UPDATE_ALL = 'inv.category.update.all',
  INV_CATEGORY_DELETE_ALL = 'inv.category.delete.all',

  INV_ITEM_CREATE_ALL = 'inv.item.create.all',
  INV_ITEM_READ_ALL = 'inv.item.read.all',
  INV_ITEM_UPDATE_ALL = 'inv.item.update.all',
  INV_ITEM_DELETE_ALL = 'inv.item.delete.all',

  INV_WAREHOUSE_CREATE_ALL = 'inv.warehouse.create.all',
  INV_WAREHOUSE_READ_ALL = 'inv.warehouse.read.all',
  INV_WAREHOUSE_UPDATE_ALL = 'inv.warehouse.update.all',
  INV_WAREHOUSE_DELETE_ALL = 'inv.warehouse.delete.all',

  INV_STOCK_READ_ALL = 'inv.stock.read.all',
  INV_STOCK_READ_OWN_WAREHOUSE = 'inv.stock.read.own_warehouse',
  INV_STOCK_ADJUST_ALL = 'inv.stock.adjust.all',
  INV_STOCK_TRANSFER_ALL = 'inv.stock.transfer.all',

  INV_SUPPLIER_CREATE_ALL = 'inv.supplier.create.all',
  INV_SUPPLIER_READ_ALL = 'inv.supplier.read.all',
  INV_SUPPLIER_UPDATE_ALL = 'inv.supplier.update.all',
  INV_SUPPLIER_DELETE_ALL = 'inv.supplier.delete.all',

  INV_PO_CREATE_ALL = 'inv.po.create.all',
  INV_PO_READ_ALL = 'inv.po.read.all',
  INV_PO_APPROVE_ALL = 'inv.po.approve.all',
  INV_PO_DELETE_ALL = 'inv.po.delete.all',

  // ==================== ASSET MANAGEMENT ====================
  ASSET_TYPE_CREATE_ALL = 'asset.type.create.all',
  ASSET_TYPE_READ_ALL = 'asset.type.read.all',
  ASSET_TYPE_UPDATE_ALL = 'asset.type.update.all',
  ASSET_TYPE_DELETE_ALL = 'asset.type.delete.all',

  ASSET_CREATE_ALL = 'asset.create.all',
  ASSET_READ_ALL = 'asset.read.all',
  ASSET_UPDATE_ALL = 'asset.update.all',
  ASSET_DELETE_ALL = 'asset.delete.all',
  ASSET_ASSIGN_ALL = 'asset.assign.all',

  // ==================== HR PERFORMANCE ====================
  HR_APPRAISAL_CREATE_ALL = 'hr.appraisal.create.all',
  HR_APPRAISAL_READ_ALL = 'hr.appraisal.read.all',
  HR_APPRAISAL_READ_OWN = 'hr.appraisal.read.own',
  HR_APPRAISAL_SUBMIT_OWN = 'hr.appraisal.submit.own',
  HR_APPRAISAL_APPROVE_ALL = 'hr.appraisal.approve.all',

  HR_GOAL_CREATE_ALL = 'hr.goal.create.all',
  HR_GOAL_READ_ALL = 'hr.goal.read.all',
  HR_GOAL_READ_OWN = 'hr.goal.read.own',
  HR_GOAL_UPDATE_ALL = 'hr.goal.update.all',
  HR_GOAL_UPDATE_OWN = 'hr.goal.update.own',

  HR_FEEDBACK_CREATE_ALL = 'hr.feedback.create.all',
  HR_FEEDBACK_READ_ALL = 'hr.feedback.read.all',
  HR_FEEDBACK_READ_OWN = 'hr.feedback.read.own',
  HR_FEEDBACK_ACKNOWLEDGE_OWN = 'hr.feedback.acknowledge.own',

  HR_BENEFIT_CREATE_ALL = 'hr.benefit.create.all',
  HR_BENEFIT_READ_ALL = 'hr.benefit.read.all',
  HR_BENEFIT_UPDATE_ALL = 'hr.benefit.update.all',

  HR_HOLIDAY_CREATE_ALL = 'hr.holiday.create.all',
  HR_HOLIDAY_READ_ALL = 'hr.holiday.read.all',
  HR_HOLIDAY_UPDATE_ALL = 'hr.holiday.update.all',

  // ==================== TRAINING ====================
  TRAIN_PROGRAM_CREATE_ALL = 'train.program.create.all',
  TRAIN_PROGRAM_READ_ALL = 'train.program.read.all',
  TRAIN_PROGRAM_UPDATE_ALL = 'train.program.update.all',
  TRAIN_PROGRAM_DELETE_ALL = 'train.program.delete.all',

  TRAIN_ATTENDANCE_READ_ALL = 'train.attendance.read.all',
  TRAIN_ATTENDANCE_READ_OWN = 'train.attendance.read.own',
  TRAIN_ATTENDANCE_MARK_ALL = 'train.attendance.mark.all',

  // ==================== EMPLOYEE ====================
  EMP_EXPENSE_CREATE_OWN = 'emp.expense.create.own',
  EMP_EXPENSE_READ_ALL = 'emp.expense.read.all',
  EMP_EXPENSE_READ_OWN = 'emp.expense.read.own',
  EMP_EXPENSE_APPROVE_ALL = 'emp.expense.approve.all',
  EMP_EXPENSE_APPROVE_OWN_DEPARTMENT = 'emp.expense.approve.own_department',

  EMP_COMPLAINT_CREATE_OWN = 'emp.complaint.create.own',
  EMP_COMPLAINT_READ_ALL = 'emp.complaint.read.all',
  EMP_COMPLAINT_READ_OWN = 'emp.complaint.read.own',
  EMP_COMPLAINT_ASSIGN_ALL = 'emp.complaint.assign.all',
  EMP_COMPLAINT_RESOLVE_ALL = 'emp.complaint.resolve.all',

  // ==================== SURVEY ====================
  SURVEY_CREATE_ALL = 'survey.create.all',
  SURVEY_READ_ALL = 'survey.read.all',
  SURVEY_UPDATE_ALL = 'survey.update.all',
  SURVEY_DELETE_ALL = 'survey.delete.all',
  SURVEY_RESPOND_ALL = 'survey.respond.all',

  // ==================== SYSTEM ====================
  SYS_SETTING_READ_ALL = 'sys.setting.read.all',
  SYS_SETTING_UPDATE_ALL = 'sys.setting.update.all',

  SYS_AUDIT_READ_ALL = 'sys.audit.read.all',
  SYS_AUDIT_READ_OWN = 'sys.audit.read.own',

  SYS_REPORT_GENERATE_ALL = 'sys.report.generate.all',
  SYS_ANALYTICS_VIEW_ALL = 'sys.analytics.view.all',

  // ==================== DASHBOARD ====================
  DASHBOARD_STAFF_READ_OWN = 'dashboard.staff.read.own',
  DASHBOARD_STAFF_TASK_READ_OWN = 'dashboard.staff.task.read.own',
  DASHBOARD_STAFF_ATTENDANCE_READ_OWN = 'dashboard.staff.attendance.read.own',
  DASHBOARD_STAFF_MESSAGE_READ_OWN = 'dashboard.staff.message.read.own',
  DASHBOARD_STAFF_CALENDAR_READ_OWN = 'dashboard.staff.calendar.read.own',
  DASHBOARD_STAFF_PAYSLIP_READ_OWN = 'dashboard.staff.payslip.read.own',
  DASHBOARD_STAFF_LEAVE_READ_OWN = 'dashboard.staff.leave.read.own',

  // ==================== ATTENDANCE MANAGEMENT ====================
  ATT_CLOCKIN_CREATE_OWN = 'att.clockin.create.own',
  ATT_CLOCKOUT_CREATE_OWN = 'att.clockout.create.own',
  ATT_GPS_READ_OWN = 'att.gps.read.own',
  ATT_GPS_READ_OWN_DEPARTMENT = 'att.gps.read.own_department',
  ATT_GPS_READ_ALL = 'att.gps.read.all',
  ATT_QR_USE_OWN = 'att.qr.use.own',
  ATT_QR_GENERATE_ALL = 'att.qr.generate.all',
  ATT_OVERTIME_READ_ALL = 'att.overtime.read.all',
  ATT_OVERTIME_READ_OWN = 'att.overtime.read.own',
  ATT_OVERTIME_APPROVE_ALL = 'att.overtime.approve.all',
  ATT_REPORTS_GENERATE_ALL = 'att.reports.generate.all',

  // ==================== HR MANAGEMENT ====================
  HR_RECRUITMENT_CREATE_ALL = 'hr.recruitment.create.all',
  HR_RECRUITMENT_READ_ALL = 'hr.recruitment.read.all',
  HR_RECRUITMENT_UPDATE_ALL = 'hr.recruitment.update.all',
  HR_RECRUITMENT_DELETE_ALL = 'hr.recruitment.delete.all',

  HR_ONBOARDING_CREATE_ALL = 'hr.onboarding.create.all',
  HR_ONBOARDING_READ_ALL = 'hr.onboarding.read.all',
  HR_ONBOARDING_READ_OWN = 'hr.onboarding.read.own',
  HR_ONBOARDING_UPDATE_ALL = 'hr.onboarding.update.all',
  HR_ONBOARDING_COMPLETE_OWN = 'hr.onboarding.complete.own',

  HR_RECORDS_READ_ALL = 'hr.records.read.all',
  HR_RECORDS_READ_OWN = 'hr.records.read.own',
  HR_RECORDS_UPDATE_ALL = 'hr.records.update.all',
  HR_RECORDS_UPDATE_OWN = 'hr.records.update.own',

  HR_PROMOTION_CREATE_ALL = 'hr.promotion.create.all',
  HR_PROMOTION_READ_ALL = 'hr.promotion.read.all',
  HR_PROMOTION_APPROVE_ALL = 'hr.promotion.approve.all',
  HR_PROMOTION_DELETE_ALL = 'hr.promotion.delete.all',

  HR_WARNING_CREATE_ALL = 'hr.warning.create.all',
  HR_WARNING_READ_ALL = 'hr.warning.read.all',
  HR_WARNING_READ_OWN = 'hr.warning.read.own',
  HR_WARNING_UPDATE_ALL = 'hr.warning.update.all',
  HR_WARNING_DELETE_ALL = 'hr.warning.delete.all',

  HR_RESIGNATION_CREATE_OWN = 'hr.resignation.create.own',
  HR_RESIGNATION_READ_ALL = 'hr.resignation.read.all',
  HR_RESIGNATION_READ_OWN = 'hr.resignation.read.own',
  HR_RESIGNATION_APPROVE_ALL = 'hr.resignation.approve.all',
  HR_RESIGNATION_DELETE_ALL = 'hr.resignation.delete.all',

  // ==================== PROJECT MANAGEMENT EXTENDED ====================
  PROJECT_KANBAN_VIEW_ALL = 'project.kanban.view.all',
  PROJECT_KANBAN_VIEW_OWN = 'project.kanban.view.own',
  PROJECT_KANBAN_UPDATE_ALL = 'project.kanban.update.all',

  PROJECT_COMMENT_CREATE_ALL = 'project.comment.create.all',
  PROJECT_COMMENT_READ_ALL = 'project.comment.read.all',
  PROJECT_COMMENT_READ_OWN = 'project.comment.read.own',
  PROJECT_COMMENT_DELETE_ALL = 'project.comment.delete.all',

  PROJECT_ATTACHMENT_CREATE_ALL = 'project.attachment.create.all',
  PROJECT_ATTACHMENT_READ_ALL = 'project.attachment.read.all',
  PROJECT_ATTACHMENT_DELETE_ALL = 'project.attachment.delete.all',

  PROJECT_COLLABORATION_CREATE_ALL = 'project.collaboration.create.all',
  PROJECT_COLLABORATION_READ_ALL = 'project.collaboration.read.all',

  // ==================== PHASE 16: CRM MODULE ====================
  // Visa Max - Visa Applicants
  CRM_VISA_APPLICANT_CREATE_ALL = 'crm.visa.applicant.create.all',
  CRM_VISA_APPLICANT_READ_ALL = 'crm.visa.applicant.read.all',
  CRM_VISA_APPLICANT_READ_OWN = 'crm.visa.applicant.read.own',
  CRM_VISA_APPLICANT_UPDATE_ALL = 'crm.visa.applicant.update.all',
  CRM_VISA_APPLICANT_UPDATE_OWN = 'crm.visa.applicant.update.own',
  CRM_VISA_APPLICANT_DELETE_ALL = 'crm.visa.applicant.delete.all',

  // Visa Max - Consultations
  CRM_CONSULTATION_CREATE_ALL = 'crm.consultation.create.all',
  CRM_CONSULTATION_READ_ALL = 'crm.consultation.read.all',
  CRM_CONSULTATION_READ_OWN = 'crm.consultation.read.own',
  CRM_CONSULTATION_UPDATE_ALL = 'crm.consultation.update.all',
  CRM_CONSULTATION_UPDATE_OWN = 'crm.consultation.update.own',
  CRM_CONSULTATION_DELETE_ALL = 'crm.consultation.delete.all',

  // Visa Max - Passport Processing
  CRM_PASSPORT_CREATE_ALL = 'crm.passport.create.all',
  CRM_PASSPORT_READ_ALL = 'crm.passport.read.all',
  CRM_PASSPORT_READ_OWN = 'crm.passport.read.own',
  CRM_PASSPORT_UPDATE_ALL = 'crm.passport.update.all',
  CRM_PASSPORT_UPDATE_OWN = 'crm.passport.update.own',
  CRM_PASSPORT_DELETE_ALL = 'crm.passport.delete.all',

  // Visa Max - Follow Ups
  CRM_FOLLOWUP_CREATE_ALL = 'crm.followup.create.all',
  CRM_FOLLOWUP_READ_ALL = 'crm.followup.read.all',
  CRM_FOLLOWUP_READ_OWN = 'crm.followup.read.own',
  CRM_FOLLOWUP_UPDATE_ALL = 'crm.followup.update.all',
  CRM_FOLLOWUP_UPDATE_OWN = 'crm.followup.update.own',
  CRM_FOLLOWUP_DELETE_ALL = 'crm.followup.delete.all',

  // Kurios Sat - Software Clients
  CRM_SOFTWARE_CLIENT_CREATE_ALL = 'crm.softwareclient.create.all',
  CRM_SOFTWARE_CLIENT_READ_ALL = 'crm.softwareclient.read.all',
  CRM_SOFTWARE_CLIENT_READ_OWN = 'crm.softwareclient.read.own',
  CRM_SOFTWARE_CLIENT_UPDATE_ALL = 'crm.softwareclient.update.all',
  CRM_SOFTWARE_CLIENT_UPDATE_OWN = 'crm.softwareclient.update.own',
  CRM_SOFTWARE_CLIENT_DELETE_ALL = 'crm.softwareclient.delete.all',

  // Kurios Sat - Hosting Clients
  CRM_HOSTING_CLIENT_CREATE_ALL = 'crm.hostingclient.create.all',
  CRM_HOSTING_CLIENT_READ_ALL = 'crm.hostingclient.read.all',
  CRM_HOSTING_CLIENT_READ_OWN = 'crm.hostingclient.read.own',
  CRM_HOSTING_CLIENT_UPDATE_ALL = 'crm.hostingclient.update.all',
  CRM_HOSTING_CLIENT_UPDATE_OWN = 'crm.hostingclient.update.own',
  CRM_HOSTING_CLIENT_DELETE_ALL = 'crm.hostingclient.delete.all',

  // Kurios Sat - Training Students
  CRM_TRAINING_STUDENT_CREATE_ALL = 'crm.trainingstudent.create.all',
  CRM_TRAINING_STUDENT_READ_ALL = 'crm.trainingstudent.read.all',
  CRM_TRAINING_STUDENT_READ_OWN = 'crm.trainingstudent.read.own',
  CRM_TRAINING_STUDENT_UPDATE_ALL = 'crm.trainingstudent.update.all',
  CRM_TRAINING_STUDENT_UPDATE_OWN = 'crm.trainingstudent.update.own',
  CRM_TRAINING_STUDENT_DELETE_ALL = 'crm.trainingstudent.delete.all',

  // Bead Max - Customers
  CRM_CUSTOMER_CREATE_ALL = 'crm.customer.create.all',
  CRM_CUSTOMER_READ_ALL = 'crm.customer.read.all',
  CRM_CUSTOMER_READ_OWN = 'crm.customer.read.own',
  CRM_CUSTOMER_UPDATE_ALL = 'crm.customer.update.all',
  CRM_CUSTOMER_UPDATE_OWN = 'crm.customer.update.own',
  CRM_CUSTOMER_DELETE_ALL = 'crm.customer.delete.all',

  // Bead Max - Orders
  CRM_ORDER_TRACKING_CREATE_ALL = 'crm.ordertracking.create.all',
  CRM_ORDER_TRACKING_READ_ALL = 'crm.ordertracking.read.all',
  CRM_ORDER_TRACKING_READ_OWN = 'crm.ordertracking.read.own',
  CRM_ORDER_TRACKING_UPDATE_ALL = 'crm.ordertracking.update.all',
  CRM_ORDER_TRACKING_UPDATE_OWN = 'crm.ordertracking.update.own',
  CRM_ORDER_TRACKING_DELETE_ALL = 'crm.ordertracking.delete.all',

  // Bead Max - Sales
  CRM_SALES_CREATE_ALL = 'crm.sales.create.all',
  CRM_SALES_READ_ALL = 'crm.sales.read.all',
  CRM_SALES_READ_OWN = 'crm.sales.read.own',
  CRM_SALES_UPDATE_ALL = 'crm.sales.update.all',
  CRM_SALES_UPDATE_OWN = 'crm.sales.update.own',
  CRM_SALES_DELETE_ALL = 'crm.sales.delete.all',

  // ==================== PHASE 17: PAYROLL & FINANCE ====================
  FIN_PAYROLL_CREATE_ALL = 'fin.payroll.create.all',
  FIN_PAYROLL_READ_ALL = 'fin.payroll.read.all',
  FIN_PAYROLL_READ_OWN = 'fin.payroll.read.own',
  FIN_PAYROLL_PROCESS_ALL = 'fin.payroll.process.all',
  FIN_PAYROLL_DELETE_ALL = 'fin.payroll.delete.all',

  FIN_PAYSLIP_READ_ALL = 'fin.payslip.read.all',
  FIN_PAYSLIP_READ_OWN = 'fin.payslip.read.own',
  FIN_PAYSLIP_DOWNLOAD_OWN = 'fin.payslip.download.own',
  FIN_PAYSLIP_GENERATE_ALL = 'fin.payslip.generate.all',

  FIN_EXPENSE_CREATE_OWN = 'fin.expense.create.own',
  FIN_EXPENSE_READ_ALL = 'fin.expense.read.all',
  FIN_EXPENSE_READ_OWN = 'fin.expense.read.own',
  FIN_EXPENSE_APPROVE_ALL = 'fin.expense.approve.all',
  FIN_EXPENSE_APPROVE_OWN_DEPARTMENT = 'fin.expense.approve.own_department',
  FIN_EXPENSE_DELETE_ALL = 'fin.expense.delete.all',

  FIN_REVENUE_CREATE_ALL = 'fin.revenue.create.all',
  FIN_REVENUE_READ_ALL = 'fin.revenue.read.all',
  FIN_REVENUE_UPDATE_ALL = 'fin.revenue.update.all',
  FIN_REVENUE_DELETE_ALL = 'fin.revenue.delete.all',

  FIN_BUDGET_CREATE_ALL = 'fin.budget.create.all',
  FIN_BUDGET_READ_ALL = 'fin.budget.read.all',
  FIN_BUDGET_READ_OWN_DEPARTMENT = 'fin.budget.read.own_department',
  FIN_BUDGET_UPDATE_ALL = 'fin.budget.update.all',
  FIN_BUDGET_DELETE_ALL = 'fin.budget.delete.all',

  FIN_INVOICE_CREATE_ALL = 'fin.invoice.create.all',
  FIN_INVOICE_READ_ALL = 'fin.invoice.read.all',
  FIN_INVOICE_READ_OWN = 'fin.invoice.read.own',
  FIN_INVOICE_UPDATE_ALL = 'fin.invoice.update.all',
  FIN_INVOICE_DELETE_ALL = 'fin.invoice.delete.all',

  FIN_PAYMENT_CREATE_ALL = 'fin.payment.create.all',
  FIN_PAYMENT_READ_ALL = 'fin.payment.read.all',
  FIN_PAYMENT_PROCESS_ALL = 'fin.payment.process.all',
  FIN_PAYMENT_APPROVE_ALL = 'fin.payment.approve.all',
  FIN_PAYMENT_DELETE_ALL = 'fin.payment.delete.all',

  // ==================== PHASE 18: INVENTORY MANAGEMENT ====================
  INV_INVENTORY_CREATE_ALL = 'inv.inventory.create.all',
  INV_INVENTORY_READ_ALL = 'inv.inventory.read.all',
  INV_INVENTORY_READ_OWN_WAREHOUSE = 'inv.inventory.read.own_warehouse',
  INV_INVENTORY_UPDATE_ALL = 'inv.inventory.update.all',
  INV_INVENTORY_DELETE_ALL = 'inv.inventory.delete.all',
  INV_INVENTORY_ADJUST_ALL = 'inv.inventory.adjust.all',

  INV_SUPPLIER_MANAGEMENT_CREATE_ALL = 'inv.suppliermgmt.create.all',
  INV_SUPPLIER_MANAGEMENT_READ_ALL = 'inv.suppliermgmt.read.all',
  INV_SUPPLIER_MANAGEMENT_UPDATE_ALL = 'inv.suppliermgmt.update.all',
  INV_SUPPLIER_MANAGEMENT_DELETE_ALL = 'inv.suppliermgmt.delete.all',

  INV_PURCHASE_ORDER_CREATE_ALL = 'inv.po.create.all',
  INV_PURCHASE_ORDER_READ_ALL = 'inv.po.read.all',
  INV_PURCHASE_ORDER_APPROVE_ALL = 'inv.po.approve.all',
  INV_PURCHASE_ORDER_DELETE_ALL = 'inv.po.delete.all',

  INV_STOCK_ALERT_READ_ALL = 'inv.stockalert.read.all',
  INV_STOCK_ALERT_READ_OWN_WAREHOUSE = 'inv.stockalert.read.own_warehouse',
  INV_STOCK_ALERT_ACKNOWLEDGE_ALL = 'inv.stockalert.acknowledge.all',
  INV_STOCK_ALERT_DELETE_ALL = 'inv.stockalert.delete.all',

  // ==================== PHASE 19: LMS MODULE ====================
  LMS_COURSE_MANAGEMENT_CREATE_ALL = 'lms.course.create.all',
  LMS_COURSE_MANAGEMENT_READ_ALL = 'lms.course.read.all',
  LMS_COURSE_MANAGEMENT_UPDATE_ALL = 'lms.course.update.all',
  LMS_COURSE_MANAGEMENT_DELETE_ALL = 'lms.course.delete.all',
  LMS_COURSE_MANAGEMENT_PUBLISH_ALL = 'lms.course.publish.all',

  LMS_LESSON_CREATE_ALL = 'lms.lesson.create.all',
  LMS_LESSON_READ_ALL = 'lms.lesson.read.all',
  LMS_LESSON_READ_OWN = 'lms.lesson.read.own',
  LMS_LESSON_UPDATE_ALL = 'lms.lesson.update.all',
  LMS_LESSON_DELETE_ALL = 'lms.lesson.delete.all',

  LMS_VIDEO_CREATE_ALL = 'lms.video.create.all',
  LMS_VIDEO_READ_ALL = 'lms.video.read.all',
  LMS_VIDEO_READ_OWN = 'lms.video.read.own',
  LMS_VIDEO_DELETE_ALL = 'lms.video.delete.all',

  LMS_ASSIGNMENT_CREATE_ALL = 'lms.assignment.create.all',
  LMS_ASSIGNMENT_READ_ALL = 'lms.assignment.read.all',
  LMS_ASSIGNMENT_READ_OWN = 'lms.assignment.read.own',
  LMS_ASSIGNMENT_SUBMIT_OWN = 'lms.assignment.submit.own',
  LMS_ASSIGNMENT_GRADE_ALL = 'lms.assignment.grade.all',
  LMS_ASSIGNMENT_DELETE_ALL = 'lms.assignment.delete.all',

  LMS_ENROLLMENT_MANAGE_ALL = 'lms.enrollment.manage.all',
  LMS_ENROLLMENT_VIEW_OWN = 'lms.enrollment.view.own',

  LMS_PROGRESS_READ_ALL = 'lms.progress.read.all',
  LMS_PROGRESS_READ_OWN = 'lms.progress.read.own',

  LMS_CERTIFICATE_AWARD_ALL = 'lms.certificate.award.all',
  LMS_CERTIFICATE_READ_OWN = 'lms.certificate.read.own',
  LMS_CERTIFICATE_DOWNLOAD_OWN = 'lms.certificate.download.own',

  // ==================== PHASE 20: CBT EXAMINATION MODULE ====================
  CBT_QUESTION_CREATE_ALL = 'cbt.question.create.all',
  CBT_QUESTION_READ_ALL = 'cbt.question.read.all',
  CBT_QUESTION_UPDATE_ALL = 'cbt.question.update.all',
  CBT_QUESTION_DELETE_ALL = 'cbt.question.delete.all',

  CBT_QUESTION_BANK_CREATE_ALL = 'cbt.questionbank.create.all',
  CBT_QUESTION_BANK_READ_ALL = 'cbt.questionbank.read.all',
  CBT_QUESTION_BANK_UPDATE_ALL = 'cbt.questionbank.update.all',
  CBT_QUESTION_BANK_DELETE_ALL = 'cbt.questionbank.delete.all',

  CBT_EXAM_CREATE_ALL = 'cbt.exam.create.all',
  CBT_EXAM_READ_ALL = 'cbt.exam.read.all',
  CBT_EXAM_UPDATE_ALL = 'cbt.exam.update.all',
  CBT_EXAM_DELETE_ALL = 'cbt.exam.delete.all',
  CBT_EXAM_PUBLISH_ALL = 'cbt.exam.publish.all',

  CBT_EXAM_ATTEMPT_OWN = 'cbt.attempt.own',
  CBT_EXAM_ATTEMPT_VIEW_ALL = 'cbt.attempt.view.all',
  CBT_EXAM_TIMER_OWN = 'cbt.timer.own',

  CBT_RESULT_READ_OWN = 'cbt.result.read.own',
  CBT_RESULT_READ_ALL = 'cbt.result.read.all',
  CBT_RESULT_EXPORT_ALL = 'cbt.result.export.all',

  CBT_RANKING_VIEW_ALL = 'cbt.ranking.view.all',
  CBT_RANKING_VIEW_OWN_DEPARTMENT = 'cbt.ranking.view.own_department',

  CBT_AUTO_GRADE_ALL = 'cbt.autograde.all',

  // ==================== PHASE 21: INTERNAL MESSAGING SYSTEM ====================
  MSG_DIRECT_MESSAGE_CREATE_OWN = 'msg.directmessage.create.own',
  MSG_DIRECT_MESSAGE_READ_OWN = 'msg.directmessage.read.own',
  MSG_DIRECT_MESSAGE_DELETE_OWN = 'msg.directmessage.delete.own',
  MSG_DIRECT_MESSAGE_DELETE_ALL = 'msg.directmessage.delete.all',

  MSG_DEPARTMENT_CHAT_CREATE_ALL = 'msg.departmentchat.create.all',
  MSG_DEPARTMENT_CHAT_READ_ALL = 'msg.departmentchat.read.all',
  MSG_DEPARTMENT_CHAT_READ_OWN_DEPARTMENT = 'msg.departmentchat.read.own_department',
  MSG_DEPARTMENT_CHAT_UPDATE_ALL = 'msg.departmentchat.update.all',
  MSG_DEPARTMENT_CHAT_DELETE_ALL = 'msg.departmentchat.delete.all',

  MSG_CHAT_MESSAGE_CREATE_OWN = 'msg.chatmessage.create.own',
  MSG_CHAT_MESSAGE_READ_ALL = 'msg.chatmessage.read.all',
  MSG_CHAT_MESSAGE_DELETE_OWN = 'msg.chatmessage.delete.own',
  MSG_CHAT_MESSAGE_DELETE_ALL = 'msg.chatmessage.delete.all',

  MSG_FILE_UPLOAD_OWN = 'msg.file.upload.own',
  MSG_FILE_READ_OWN = 'msg.file.read.own',
  MSG_FILE_DELETE_OWN = 'msg.file.delete.own',

  MSG_VOICE_NOTE_RECORD_OWN = 'msg.voicenote.record.own',
  MSG_VOICE_NOTE_PLAY_ALL = 'msg.voicenote.play.all',

  MSG_READ_RECEIPT_VIEW_OWN = 'msg.readreceipt.view.own',
  MSG_READ_RECEIPT_MARK_OWN = 'msg.readreceipt.mark.own',

  MSG_NOTIFICATION_READ_OWN = 'msg.notification.read.own',
  MSG_NOTIFICATION_DELETE_OWN = 'msg.notification.delete.own',
}
