export declare function sendWelcomeEmail(params: {
    to: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    temporaryPassword: string;
    position?: string;
    businessUnit?: string;
    department?: string;
}): Promise<boolean>;
export declare function sendStaffCredentials(params: {
    to: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    temporaryPassword: string;
    position?: string;
    businessUnit?: string;
    department?: string;
}): Promise<boolean>;
export declare function sendRecruitmentEmail(params: {
    to: string;
    applicantName: string;
    jobTitle: string;
    subject: string;
    message: string;
}): Promise<boolean>;
export declare function sendInterviewInvitation(params: {
    to: string;
    applicantName: string;
    jobTitle: string;
    interviewDate: string;
    interviewTime: string;
    location?: string;
    interviewerName?: string;
    notes?: string;
}): Promise<boolean>;
//# sourceMappingURL=hr-email.service.d.ts.map