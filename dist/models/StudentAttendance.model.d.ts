import { Model, Optional, Sequelize } from 'sequelize';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'Holiday';
interface StudentAttendanceAttributes {
    id: bigint;
    uuid: string;
    studentId: bigint;
    courseId: bigint;
    classScheduleId?: bigint;
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    minutesLate?: number;
    excuseReason?: string;
    notes?: string;
    markedById?: bigint;
    markedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
interface StudentAttendanceCreationAttributes extends Optional<StudentAttendanceAttributes, 'id' | 'uuid' | 'status'> {
}
export declare class StudentAttendance extends Model<StudentAttendanceAttributes, StudentAttendanceCreationAttributes> implements StudentAttendanceAttributes {
    id: bigint;
    uuid: string;
    studentId: bigint;
    courseId: bigint;
    classScheduleId?: bigint;
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    minutesLate?: number;
    excuseReason?: string;
    notes?: string;
    markedById?: bigint;
    markedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StudentAttendance;
}
export default StudentAttendance;
//# sourceMappingURL=StudentAttendance.model.d.ts.map