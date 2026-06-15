import { Model } from 'sequelize';
export interface ILesson {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    courseModuleId?: bigint;
    lessonTitle: string;
    lessonNumber: number;
    description?: string;
    content?: string;
    duration: number;
    sequence: number;
    status: 'Draft' | 'Published' | 'Archived';
    isPreview: boolean;
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Lesson extends Model<ILesson> implements ILesson {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    courseModuleId?: bigint;
    lessonTitle: string;
    lessonNumber: number;
    description?: string;
    content?: string;
    duration: number;
    sequence: number;
    status: 'Draft' | 'Published' | 'Archived';
    isPreview: boolean;
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Lesson;
//# sourceMappingURL=LMS-Lesson.model.d.ts.map