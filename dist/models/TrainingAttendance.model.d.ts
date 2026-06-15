import { Model, Optional, Sequelize } from 'sequelize';
interface TrainingAttendanceAttributes {
    id: bigint;
    uuid: string;
    trainingProgramId: bigint;
    staffId: bigint;
    attendanceDate: Date;
    status: 'Attended' | 'Absent' | 'ExcusedAbsent' | 'LateArrival' | 'EarlyLeaving';
    arrivalTime?: Date;
    departureTime?: Date;
    feedbackRating?: number;
    feedbackComments?: string;
    certificateIssued: boolean;
    deletedAt?: Date;
}
interface TrainingAttendanceCreationAttributes extends Optional<TrainingAttendanceAttributes, 'id' | 'uuid'> {
}
export declare class TrainingAttendance extends Model<TrainingAttendanceAttributes, TrainingAttendanceCreationAttributes> implements TrainingAttendanceAttributes {
    id: bigint;
    uuid: string;
    trainingProgramId: bigint;
    staffId: bigint;
    attendanceDate: Date;
    status: 'Attended' | 'Absent' | 'ExcusedAbsent' | 'LateArrival' | 'EarlyLeaving';
    arrivalTime?: Date;
    departureTime?: Date;
    feedbackRating?: number;
    feedbackComments?: string;
    certificateIssued: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof TrainingAttendance;
}
export {};
//# sourceMappingURL=TrainingAttendance.model.d.ts.map