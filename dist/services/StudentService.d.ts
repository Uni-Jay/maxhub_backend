import { StudentProfile, StudentStatus } from '@models/StudentProfile.model';
import { StudentEnrollment } from '@models/StudentEnrollment.model';
import { StudentResult } from '@models/StudentResult.model';
import { StudentAttendance, AttendanceStatus } from '@models/StudentAttendance.model';
import { ClassSchedule } from '@models/ClassSchedule.model';
interface RegisterStudentInput {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    companyId: bigint;
    programId?: bigint;
    departmentId?: bigint;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    state?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelationship?: string;
    enrollmentDate?: string;
    registeredById?: bigint;
}
interface AttendanceMarkInput {
    studentIds: bigint[];
    courseId: bigint;
    classScheduleId?: bigint;
    date: string;
    statuses: Record<string, AttendanceStatus>;
    markedById: bigint;
}
export declare class StudentService {
    registerStudent(input: RegisterStudentInput): Promise<StudentProfile>;
    getStudents(filters: {
        companyId?: bigint;
        programId?: bigint;
        departmentId?: bigint | bigint[];
        status?: StudentStatus;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        students: StudentProfile[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStudentById(studentId: bigint): Promise<StudentProfile>;
    getStudentByUserId(userId: bigint): Promise<StudentProfile>;
    updateStudent(studentId: bigint, data: Partial<StudentProfile> & {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    }): Promise<StudentProfile>;
    deleteStudent(studentId: bigint): Promise<void>;
    updateStudentStatus(studentId: bigint, status: StudentStatus, notes?: string): Promise<StudentProfile>;
    enrollStudent(studentId: bigint, courseId: bigint, enrolledById?: bigint): Promise<StudentEnrollment>;
    getStudentEnrollments(studentId: bigint): Promise<StudentEnrollment[]>;
    markAttendance(input: AttendanceMarkInput): Promise<[StudentAttendance, boolean | null][]>;
    getStudentAttendance(studentId: bigint, courseId?: bigint, dateFrom?: string, dateTo?: string): Promise<{
        records: StudentAttendance[];
        summary: {
            total: number;
            present: number;
            attendancePercentage: number;
        };
    }>;
    recordResult(data: {
        studentId: bigint;
        courseId?: bigint;
        examId?: bigint;
        assignmentId?: bigint;
        type: string;
        title: string;
        score: number;
        maxScore: number;
        passMark?: number;
        feedback?: string;
        gradedById?: bigint;
    }): Promise<StudentResult>;
    getStudentResults(studentId: bigint, courseId?: bigint): Promise<StudentResult[]>;
    getCourseSchedule(courseId: bigint): Promise<ClassSchedule[]>;
    getStudentAnalytics(studentId: bigint): Promise<{
        totalCourses: number;
        activeCourses: number;
        completedCourses: number;
        avgScore: number;
        passedExams: number;
        totalExams: number;
        passRate: number;
        attendancePct: number;
        certificatesEarned: number;
    }>;
    private calculateGrade;
}
declare const _default: StudentService;
export default _default;
//# sourceMappingURL=StudentService.d.ts.map