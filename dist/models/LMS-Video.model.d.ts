import { Model } from 'sequelize';
export interface IVideo {
    id: bigint;
    organizationId: bigint;
    lessonId: bigint;
    videoTitle: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    fileSize: number;
    videoType: 'YouTube' | 'Vimeo' | 'Local' | 'External';
    transcription?: string;
    subtitles?: JSON;
    sequence: number;
    status: 'Processing' | 'Ready' | 'Failed' | 'Archived';
    uploadedBy?: bigint;
    uploadedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Video extends Model<IVideo> implements IVideo {
    id: bigint;
    organizationId: bigint;
    lessonId: bigint;
    videoTitle: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    fileSize: number;
    videoType: 'YouTube' | 'Vimeo' | 'Local' | 'External';
    transcription?: string;
    subtitles?: JSON;
    sequence: number;
    status: 'Processing' | 'Ready' | 'Failed' | 'Archived';
    uploadedBy?: bigint;
    uploadedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Video;
//# sourceMappingURL=LMS-Video.model.d.ts.map