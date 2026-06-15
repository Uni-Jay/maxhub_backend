import { Model, Optional, Sequelize } from 'sequelize';
interface StaffSkillAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    skillName: string;
    proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    yearsOfExperience?: number;
    endorsementCount: number;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
}
interface StaffSkillCreationAttributes extends Optional<StaffSkillAttributes, 'id' | 'uuid' | 'endorsementCount'> {
}
export declare class StaffSkill extends Model<StaffSkillAttributes, StaffSkillCreationAttributes> implements StaffSkillAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    skillName: string;
    proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    yearsOfExperience?: number;
    endorsementCount: number;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StaffSkill;
}
export {};
//# sourceMappingURL=StaffSkill.model.d.ts.map