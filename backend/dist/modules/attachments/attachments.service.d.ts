import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { StorageService } from '../storage/storage.service';
import { AttachmentStatus, AttachmentType } from '../../common/constants';
export interface AttachmentWithSource {
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
    createdAt: Date;
    updatedAt: Date;
    courseTitle: string | null;
    courseType: string | null;
    lessonTitle: string | null;
    chapterTitle: string | null;
}
export declare class AttachmentsService {
    private readonly attachmentRepository;
    private readonly storageService;
    private readonly logger;
    constructor(attachmentRepository: Repository<Attachment>, storageService: StorageService);
    create(userId: number, createAttachmentDto: CreateAttachmentDto): Promise<Attachment>;
    findOne(id: number): Promise<Attachment>;
    findByCourse(courseId: number): Promise<Attachment[]>;
    findByUser(userId: number, page?: number, pageSize?: number): Promise<{
        items: Attachment[];
        total: number;
    }>;
    findPending(page?: number, pageSize?: number): Promise<{
        items: Attachment[];
        total: number;
    }>;
    countPending(): Promise<number>;
    findPendingWithSource(page?: number, pageSize?: number): Promise<{
        items: AttachmentWithSource[];
        total: number;
    }>;
    review(id: number, reviewerId: number, status: AttachmentStatus.APPROVED | AttachmentStatus.REJECTED, reviewComment?: string): Promise<Attachment>;
    getDownloadUrl(id: number, requireApproved?: boolean, expiry?: number): Promise<string>;
    softDelete(id: number, userId: number, isSuperAdmin?: boolean): Promise<void>;
    uploadFile(userId: number, file: Express.Multer.File, uploadDto: UploadAttachmentDto): Promise<Attachment>;
    findByLesson(lessonId: number): Promise<Attachment[]>;
    findApprovedByCourse(courseId: number): Promise<Attachment[]>;
    findApprovedByLesson(lessonId: number): Promise<Attachment[]>;
    hardDelete(id: number): Promise<void>;
}
