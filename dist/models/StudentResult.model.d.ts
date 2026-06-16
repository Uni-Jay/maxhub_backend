import { Model, Optional, Sequelize } from 'sequelize';
export type ResultType = 'Exam' | 'Assignment' | 'Quiz' | 'Project' | 'Practical';
export type ResultStatus = 'Pending' | 'Graded' | 'Published' | 'Appealed';
interface StudentResultAttributes {
    id: bigint;
    uuid: string;
    studentId: bigint;
    courseId?: bigint;
    examId?: bigint;
    assignmentId?: bigint;
    type: ResultType;
    title: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    gradePoints?: number;
    passed: boolean;
    passMark: number;
    attemptNumber: number;
    timeTakenMinutes?: number;
    feedback?: string;
    gradedById?: bigint;
    gradedAt?: Date;
    publishedAt?: Date;
    status: ResultStatus;
    appealReason?: string;
    appealReviewedBy?: bigint;
    appealReviewedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
interface StudentResultCreationAttributes extends Optional<StudentResultAttributes, 'id' | 'uuid' | 'status' | 'passed' | 'attemptNumber' | 'passMark' | 'percentage' | 'grade'> {
}
export declare class StudentResult extends Model<StudentResultAttributes, StudentResultCreationAttributes> implements StudentResultAttributes {
    id: bigint;
    uuid: string;
    studentId: bigint;
    courseId?: bigint;
    examId?: bigint;
    assignmentId?: bigint;
    type: ResultType;
    title: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    gradePoints?: number;
    passed: boolean;
    passMark: number;
    attemptNumber: number;
    timeTakenMinutes?: number;
    feedback?: string;
    gradedById?: bigint;
    gradedAt?: Date;
    publishedAt?: Date;
    status: ResultStatus;
    appealReason?: string;
    appealReviewedBy?: bigint;
    appealReviewedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StudentResult;
}
export default StudentResult;
//# sourceMappingURL=StudentResult.model.d.ts.map