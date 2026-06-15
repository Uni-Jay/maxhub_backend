import { Model } from 'sequelize';
export interface IVideoTranscription {
    id: bigint;
    organizationId: bigint;
    videoId: bigint;
    language: string;
    languageCode: string;
    transcriptionText: string;
    transcriptionFormat: 'Plain' | 'VTT' | 'SRT' | 'JSON';
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    processedAt?: Date;
    processedBy?: string;
    confidence?: number;
    wordCount?: number;
    characterCount?: number;
    uploadedAt: Date;
    createdBy: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class VideoTranscription extends Model<IVideoTranscription> implements IVideoTranscription {
    id: bigint;
    organizationId: bigint;
    videoId: bigint;
    language: string;
    languageCode: string;
    transcriptionText: string;
    transcriptionFormat: 'Plain' | 'VTT' | 'SRT' | 'JSON';
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    processedAt?: Date;
    processedBy?: string;
    confidence?: number;
    wordCount?: number;
    characterCount?: number;
    uploadedAt: Date;
    createdBy: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default VideoTranscription;
//# sourceMappingURL=LMS-VideoTranscription.model.d.ts.map