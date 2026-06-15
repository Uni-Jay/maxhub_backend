import { Model } from 'sequelize';
export interface IVoiceNote {
    id: bigint;
    organizationId: bigint;
    directMessageId?: bigint;
    chatMessageId?: bigint;
    voiceUrl: string;
    duration: number;
    fileSize: number;
    transcription?: string;
    transcriptionStatus: 'Pending' | 'Completed' | 'Failed';
    uploadedAt: Date;
    uploadedBy: bigint;
    playedAt?: Date;
    playCount: number;
    isBookmarked: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class VoiceNote extends Model<IVoiceNote> implements IVoiceNote {
    id: bigint;
    organizationId: bigint;
    directMessageId?: bigint;
    chatMessageId?: bigint;
    voiceUrl: string;
    duration: number;
    fileSize: number;
    transcription?: string;
    transcriptionStatus: 'Pending' | 'Completed' | 'Failed';
    uploadedAt: Date;
    uploadedBy: bigint;
    playedAt?: Date;
    playCount: number;
    isBookmarked: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default VoiceNote;
//# sourceMappingURL=MSG-VoiceNote.model.d.ts.map