import { Model } from 'sequelize';
export interface ICoursePrerequisite {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    prerequisiteCourseId: bigint;
    isRequired: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CoursePrerequisite extends Model<ICoursePrerequisite> implements ICoursePrerequisite {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    prerequisiteCourseId: bigint;
    isRequired: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export default CoursePrerequisite;
//# sourceMappingURL=LMS-CoursePrerequisite.model.d.ts.map