import { Model, Optional, Sequelize } from 'sequelize';
interface CourseContentAttributes {
    id: bigint;
    uuid: string;
    moduleId: bigint;
    contentType: 'Video' | 'Document' | 'Quiz' | 'Assignment' | 'Resource' | 'Interactive';
    contentTitle: string;
    description?: string;
    contentUrl: string;
    sequence: number;
    duration?: number;
    isRequired: boolean;
    status: 'Draft' | 'Published' | 'Archived';
    deletedAt?: Date;
}
interface CourseContentCreationAttributes extends Optional<CourseContentAttributes, 'id' | 'uuid'> {
}
export declare class CourseContent extends Model<CourseContentAttributes, CourseContentCreationAttributes> implements CourseContentAttributes {
    id: bigint;
    uuid: string;
    moduleId: bigint;
    contentType: 'Video' | 'Document' | 'Quiz' | 'Assignment' | 'Resource' | 'Interactive';
    contentTitle: string;
    description?: string;
    contentUrl: string;
    sequence: number;
    duration?: number;
    isRequired: boolean;
    status: 'Draft' | 'Published' | 'Archived';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof CourseContent;
}
export {};
//# sourceMappingURL=CourseContent.model.d.ts.map