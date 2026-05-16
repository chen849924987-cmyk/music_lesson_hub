import { AttachmentType, AttachmentStatus } from '../../../common/constants';
export declare class Attachment {
    id: number;
    userId: number;
    courseId: number;
    lessonId: number | null;
    originalName: string;
    objectName: string;
    fileSize: number;
    mimeType: string;
    attachmentType: AttachmentType;
    status: AttachmentStatus;
    reviewComment: string;
    reviewerId: number;
    reviewedAt: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
