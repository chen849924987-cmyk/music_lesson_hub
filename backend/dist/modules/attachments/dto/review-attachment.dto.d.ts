import { AttachmentStatus } from '../../../common/constants';
export declare class ReviewAttachmentDto {
    status: AttachmentStatus.APPROVED | AttachmentStatus.REJECTED;
    reviewComment?: string;
}
