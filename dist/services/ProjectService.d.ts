import { Request } from 'express';
import { BaseService } from './BaseService';
export interface CommentRequest {
    taskId: bigint;
    projectId: bigint;
    content: string;
    mentionedStaffIds?: bigint[];
    parentCommentId?: bigint;
}
export interface TaskAssignmentRequest {
    taskId: bigint;
    projectId: bigint;
    assignedToStaffId: bigint;
    estimatedHours?: number;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}
export interface KanbanBoardRequest {
    projectId: bigint;
    name: string;
    description?: string;
    boardType?: 'Kanban' | 'Sprint' | 'Custom';
    statusColumns?: string[];
}
export interface AttachmentRequest {
    projectId?: bigint;
    taskId?: bigint;
    commentId?: bigint;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    attachmentType: 'Document' | 'Image' | 'Video' | 'Audio' | 'Other';
    description?: string;
}
export declare class ProjectService extends BaseService {
    addComment(req: Request, commentData: CommentRequest): Promise<{
        message: string;
        commentId: number;
        createdAt: Date;
    }>;
    updateComment(req: Request, commentId: bigint, content: string): Promise<{
        message: string;
    }>;
    deleteComment(req: Request, commentId: bigint): Promise<{
        message: string;
    }>;
    resolveComment(req: Request, commentId: bigint): Promise<{
        message: string;
    }>;
    uploadAttachment(req: Request, attachmentData: AttachmentRequest): Promise<{
        message: string;
        attachmentId: number;
        uploadedAt: Date;
    }>;
    downloadAttachment(req: Request, attachmentId: bigint): Promise<{
        fileUrl: string;
        fileName: string;
        fileType: string;
    }>;
    assignTask(req: Request, assignmentData: TaskAssignmentRequest): Promise<{
        message: string;
        assignmentStatus: string;
        assignedDate: Date;
    }>;
    acceptTaskAssignment(req: Request, assignmentId: bigint, staffId: bigint): Promise<{
        message: string;
    }>;
    declineTaskAssignment(req: Request, assignmentId: bigint, staffId: bigint, reason: string): Promise<{
        message: string;
    }>;
    createKanbanBoard(req: Request, boardData: KanbanBoardRequest): Promise<{
        message: string;
        boardId: number;
    }>;
    updateKanbanBoard(req: Request, boardId: bigint, boardData: Partial<KanbanBoardRequest>): Promise<{
        message: string;
    }>;
    moveTaskOnBoard(req: Request, boardId: bigint, taskId: bigint, newStatus: string): Promise<{
        message: string;
        newStatus: string;
    }>;
    getKanbanView(req: Request, projectId: bigint): Promise<{
        board: {};
        tasks: {};
        columns: never[];
    }>;
}
//# sourceMappingURL=ProjectService.d.ts.map