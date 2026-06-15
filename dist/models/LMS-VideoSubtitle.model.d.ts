import { Model } from 'sequelize';
export interface IVideoSubtitle {
    id: bigint;
    organizationId: bigint;
    videoId: bigint;
    language: string;
    languageCode: string;
    vttUrl: string;
    srtUrl?: string;
    jsonUrl?: string;
    fileSize: number;
    uploadedAt: Date;
    uploadedBy: bigint;
    isDefault: boolean;
    status: 'Ready' | 'Processing' | 'Failed';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class VideoSubtitle extends Model<IVideoSubtitle> implements IVideoSubtitle {
    id: bigint;
    organizationId: bigint;
    videoId: bigint;
    language: string;
    languageCode: string;
    vttUrl: string;
    srtUrl?: string;
    jsonUrl?: string;
    fileSize: number;
    uploadedAt: Date;
    uploadedBy: bigint;
    isDefault: boolean;
    status: 'Ready' | 'Processing' | 'Failed';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default VideoSubtitle;
//# sourceMappingURL=LMS-VideoSubtitle.model.d.ts.map