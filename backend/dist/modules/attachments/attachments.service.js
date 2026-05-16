"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AttachmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const path_1 = require("path");
const attachment_entity_1 = require("./entities/attachment.entity");
const storage_service_1 = require("../storage/storage.service");
const constants_1 = require("../../common/constants");
let AttachmentsService = AttachmentsService_1 = class AttachmentsService {
    attachmentRepository;
    storageService;
    logger = new common_1.Logger(AttachmentsService_1.name);
    constructor(attachmentRepository, storageService) {
        this.attachmentRepository = attachmentRepository;
        this.storageService = storageService;
    }
    async create(userId, createAttachmentDto) {
        const attachment = this.attachmentRepository.create({
            userId,
            ...createAttachmentDto,
        });
        const saved = await this.attachmentRepository.save(attachment);
        this.logger.log(`附件记录创建成功: id=${saved.id}, courseId=${saved.courseId}, name=${saved.originalName}`);
        return saved;
    }
    async findOne(id) {
        const attachment = await this.attachmentRepository.findOne({
            where: { id, isDeleted: false },
        });
        if (!attachment) {
            throw new common_1.NotFoundException(`附件记录不存在: id=${id}`);
        }
        return attachment;
    }
    async findByCourse(courseId) {
        return this.attachmentRepository.find({
            where: { courseId, isDeleted: false },
            order: { createdAt: 'DESC' },
        });
    }
    async findByUser(userId, page = 1, pageSize = 20) {
        const [items, total] = await this.attachmentRepository.findAndCount({
            where: { userId, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total };
    }
    async findPending(page = 1, pageSize = 20) {
        const [items, total] = await this.attachmentRepository.findAndCount({
            where: { status: constants_1.AttachmentStatus.PENDING, isDeleted: false },
            order: { createdAt: 'ASC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total };
    }
    async countPending() {
        return this.attachmentRepository.count({
            where: { status: constants_1.AttachmentStatus.PENDING, isDeleted: false },
        });
    }
    async findPendingWithSource(page = 1, pageSize = 20) {
        try {
            const [attachments, total] = await this.attachmentRepository.findAndCount({
                where: { status: constants_1.AttachmentStatus.PENDING, isDeleted: false },
                order: { createdAt: 'ASC' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            });
            if (attachments.length === 0) {
                return { items: [], total: 0 };
            }
            const manager = this.attachmentRepository.manager;
            const coursesMap = new Map();
            if (attachments.length > 0) {
                const ids = [...new Set(attachments.map((a) => a.courseId))];
                for (const courseId of ids) {
                    const rows = await manager.query('SELECT title, courseType FROM courses WHERE id = ?', [courseId]);
                    if (rows.length > 0) {
                        coursesMap.set(courseId, {
                            title: rows[0].title,
                            courseType: rows[0].courseType,
                        });
                    }
                }
            }
            const lessonsMap = new Map();
            const needLesson = attachments.filter((a) => a.lessonId != null);
            for (const att of needLesson) {
                const rows = await manager.query('SELECT l.title AS ltitle, c.title AS ctitle FROM lessons l LEFT JOIN chapters c ON c.id = l.chapterId WHERE l.id = ?', [att.lessonId]);
                if (rows.length > 0) {
                    lessonsMap.set(att.lessonId, {
                        lessonTitle: rows[0].ltitle || null,
                        chapterTitle: rows[0].ctitle || null,
                    });
                }
            }
            const items = attachments.map((att) => {
                const course = coursesMap.get(att.courseId);
                const lesson = att.lessonId ? lessonsMap.get(att.lessonId) : undefined;
                return {
                    id: att.id,
                    userId: att.userId,
                    courseId: att.courseId,
                    lessonId: att.lessonId,
                    originalName: att.originalName,
                    objectName: att.objectName,
                    fileSize: Number(att.fileSize),
                    mimeType: att.mimeType,
                    attachmentType: att.attachmentType,
                    status: att.status,
                    reviewComment: att.reviewComment,
                    reviewerId: att.reviewerId,
                    reviewedAt: att.reviewedAt,
                    createdAt: att.createdAt,
                    updatedAt: att.updatedAt,
                    courseTitle: course?.title || null,
                    courseType: course?.courseType || null,
                    lessonTitle: lesson?.lessonTitle || null,
                    chapterTitle: lesson?.chapterTitle || null,
                };
            });
            return { items, total };
        }
        catch (error) {
            this.logger.error(`findPendingWithSource 查询失败: ${error.message}`, error);
            throw new common_1.InternalServerErrorException('获取待审核附件失败');
        }
    }
    async review(id, reviewerId, status, reviewComment) {
        const attachment = await this.findOne(id);
        if (attachment.status !== constants_1.AttachmentStatus.PENDING) {
            throw new common_1.ForbiddenException('该附件已审核，不能重复审核');
        }
        if (status === constants_1.AttachmentStatus.REJECTED && !reviewComment) {
            throw new common_1.ForbiddenException('驳回附件时必须填写审核意见');
        }
        attachment.status = status;
        attachment.reviewerId = reviewerId;
        attachment.reviewedAt = new Date();
        if (reviewComment) {
            attachment.reviewComment = reviewComment;
        }
        const saved = await this.attachmentRepository.save(attachment);
        this.logger.log(`附件审核完成: id=${id}, status=${status}`);
        return saved;
    }
    async getDownloadUrl(id, requireApproved = true, expiry = 3600) {
        const attachment = await this.findOne(id);
        if (requireApproved && attachment.status !== constants_1.AttachmentStatus.APPROVED) {
            throw new common_1.ForbiddenException('附件未通过审核，无法下载');
        }
        return this.storageService.getPresignedUrl(attachment.objectName, expiry);
    }
    async softDelete(id, userId, isSuperAdmin = false) {
        const attachment = await this.findOne(id);
        if (attachment.userId !== userId && !isSuperAdmin) {
            throw new common_1.NotFoundException('无权操作此附件');
        }
        await this.attachmentRepository.update(id, { isDeleted: true });
        this.logger.log(`附件已软删除: id=${id}`);
    }
    async uploadFile(userId, file, uploadDto) {
        try {
            const ext = (0, path_1.extname)(file.originalname);
            const objectName = `attachments/${uploadDto.courseId}/${(0, crypto_1.randomUUID)()}${ext}`;
            await this.storageService.uploadFile(objectName, file.buffer, file.size, file.mimetype);
            const newAttachment = this.attachmentRepository.create({
                userId,
                courseId: uploadDto.courseId,
                lessonId: uploadDto.lessonId || null,
                originalName: file.originalname,
                objectName,
                fileSize: file.size,
                mimeType: file.mimetype,
                attachmentType: uploadDto.attachmentType || constants_1.AttachmentType.OTHER,
                status: constants_1.AttachmentStatus.PENDING,
            });
            const saved = await this.attachmentRepository.save(newAttachment);
            this.logger.log(`附件文件上传成功: id=${saved.id}, courseId=${saved.courseId}, name=${saved.originalName}, size=${file.size}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`附件文件上传失败: userId=${userId}, name=${file.originalname}`, error);
            throw new common_1.InternalServerErrorException('附件文件上传失败，请稍后重试');
        }
    }
    async findByLesson(lessonId) {
        return this.attachmentRepository.find({
            where: { lessonId, isDeleted: false },
            order: { createdAt: 'DESC' },
        });
    }
    async findApprovedByCourse(courseId) {
        return this.attachmentRepository.find({
            where: {
                courseId,
                isDeleted: false,
                status: constants_1.AttachmentStatus.APPROVED,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async findApprovedByLesson(lessonId) {
        return this.attachmentRepository.find({
            where: {
                lessonId,
                isDeleted: false,
                status: constants_1.AttachmentStatus.APPROVED,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async hardDelete(id) {
        const attachment = await this.findOne(id);
        await this.storageService.deleteFile(attachment.objectName);
        await this.attachmentRepository.delete(id);
        this.logger.log(`附件已物理删除: id=${id}`);
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = AttachmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attachment_entity_1.Attachment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        storage_service_1.StorageService])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map