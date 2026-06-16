import { Model, Optional, Sequelize } from 'sequelize';
export type ProgramLevel = 'Certificate' | 'Diploma' | 'Professional' | 'Short Course';
export type ProgramStatus = 'Active' | 'Inactive' | 'Draft';
interface ProgramAttributes {
    id: bigint;
    uuid: string;
    companyId: bigint;
    name: string;
    code: string;
    description?: string;
    level: ProgramLevel;
    durationMonths: number;
    maxStudents?: number;
    tuitionFee?: number;
    currency: string;
    prerequisites?: string;
    outcomes?: string;
    thumbnail?: string;
    status: ProgramStatus;
    createdById?: bigint;
    createdAt?: Date;
    updatedAt?: Date;
}
interface ProgramCreationAttributes extends Optional<ProgramAttributes, 'id' | 'uuid' | 'status' | 'currency'> {
}
export declare class Program extends Model<ProgramAttributes, ProgramCreationAttributes> implements ProgramAttributes {
    id: bigint;
    uuid: string;
    companyId: bigint;
    name: string;
    code: string;
    description?: string;
    level: ProgramLevel;
    durationMonths: number;
    maxStudents?: number;
    tuitionFee?: number;
    currency: string;
    prerequisites?: string;
    outcomes?: string;
    thumbnail?: string;
    status: ProgramStatus;
    createdById?: bigint;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Program;
}
export default Program;
//# sourceMappingURL=Program.model.d.ts.map