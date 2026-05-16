import { AttachmentType } from '../../../common/constants';
export declare class CreateAttachmentDto {
    courseId: number;
    lessonId?: number;
    originalName: string;
    objectName: string;
    fileSize: number;
    mimeType?: string;
    attachmentType?: AttachmentType;
}
