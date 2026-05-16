import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { ReviewAttachmentDto } from './dto/review-attachment.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '../../common/dto/response.dto';
import { PaginationMeta } from '../../common/dto/pagination.dto';
export declare class AttachmentsController {
    private readonly attachmentsService;
    constructor(attachmentsService: AttachmentsService);
    create(userId: number, createAttachmentDto: CreateAttachmentDto): Promise<ApiResponse<import("./entities/attachment.entity").Attachment>>;
    upload(userId: number, file: Express.Multer.File, uploadDto: UploadAttachmentDto): Promise<ApiResponse<import("./entities/attachment.entity").Attachment>>;
    findMyAttachments(userId: number, page?: number, pageSize?: number): Promise<ApiResponse<{
        items: import("./entities/attachment.entity").Attachment[];
        meta: PaginationMeta;
    }>>;
    findPending(page?: number, pageSize?: number): Promise<ApiResponse<{
        items: import("./entities/attachment.entity").Attachment[];
        meta: PaginationMeta;
    }>>;
    findPendingWithSource(page?: number, pageSize?: number): Promise<ApiResponse<{
        items: import("./attachments.service").AttachmentWithSource[];
        meta: PaginationMeta;
    }>>;
    getPendingAttachmentCount(): Promise<ApiResponse<{
        count: number;
    }>>;
    findByCourse(courseId: number): Promise<ApiResponse<import("./entities/attachment.entity").Attachment[]>>;
    findByLesson(lessonId: number): Promise<ApiResponse<import("./entities/attachment.entity").Attachment[]>>;
    findOne(id: number): Promise<ApiResponse<import("./entities/attachment.entity").Attachment>>;
    review(id: number, userId: number, reviewDto: ReviewAttachmentDto): Promise<ApiResponse<import("./entities/attachment.entity").Attachment>>;
    getDownloadUrl(id: number): Promise<ApiResponse<{
        url: string;
    }>>;
    getPreviewUrl(id: number): Promise<ApiResponse<{
        url: string;
    }>>;
    remove(user: JwtPayload, id: number): Promise<ApiResponse<null>>;
}
