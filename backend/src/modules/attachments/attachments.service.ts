import { Injectable, Logger, NotFoundException, ForbiddenException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Attachment } from './entities/attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { StorageService } from '../storage/storage.service';
import { AttachmentStatus, AttachmentType } from '../../common/constants';

/**
 * 附件来源信息（审核页专用）
 * 功能描述：在 Attachment 实体基础上扩展来源课程/课时/章节标题，
 *          用于附件审核页面标注附件来源
 */
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

/**
 * 附件管理服务
 * 功能描述：提供课程附件（课件、乐谱等）的 CRUD 操作，支持文件上传后的记录创建、审核流程、下载地址获取等
 * 附件文件的上传与存储由 StorageService（MinIO）处理，本服务仅管理数据库中的元数据和审核流程
 */
@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * 创建附件记录（上传附件后在数据库中记录元数据）
   * @param userId - 上传者用户ID
   * @param createAttachmentDto - 附件元数据
   * @returns 创建的附件记录（初始状态为待审核）
   */
  async create(userId: number, createAttachmentDto: CreateAttachmentDto): Promise<Attachment> {
    const attachment = this.attachmentRepository.create({
      userId,
      ...createAttachmentDto,
    });
    const saved = await this.attachmentRepository.save(attachment);
    this.logger.log(`附件记录创建成功: id=${saved.id}, courseId=${saved.courseId}, name=${saved.originalName}`);
    return saved;
  }

  /**
   * 根据ID查询附件记录
   * @param id - 附件ID
   * @returns 附件记录
   * @throws NotFoundException 当附件不存在或已被删除时抛出
   */
  async findOne(id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!attachment) {
      throw new NotFoundException(`附件记录不存在: id=${id}`);
    }
    return attachment;
  }

  /**
   * 获取指定课程的所有附件列表
   * @param courseId - 课程ID
   * @returns 附件列表
   */
  async findByCourse(courseId: number): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { courseId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取用户上传的附件列表（分页）
   * @param userId - 用户ID
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 附件列表及总数
   */
  async findByUser(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: Attachment[]; total: number }> {
    const [items, total] = await this.attachmentRepository.findAndCount({
      where: { userId, isDeleted: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  /**
   * 获取待审核的附件列表（分页，审核员/管理员使用）
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 待审核附件列表及总数
   */
  async findPending(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: Attachment[]; total: number }> {
    const [items, total] = await this.attachmentRepository.findAndCount({
      where: { status: AttachmentStatus.PENDING, isDeleted: false },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  /**
   * 获取待审核附件数量
   * 功能描述：统计当前待审核的附件总数，用于审核员控制台显示待办事项数量
   * @returns 待审核附件数量
   */
  async countPending(): Promise<number> {
    return this.attachmentRepository.count({
      where: { status: AttachmentStatus.PENDING, isDeleted: false },
    });
  }

  /**
   * 获取待审核附件列表（带来源信息，审核员/管理员使用）
   *
   * 功能描述：两步查询法——先用 find() 获取附件记录（避免 getRawMany() 导致的
   *          bigint 类型丢失和字段映射异常），再批量查询课程/课时/章节标题。
   *          用于在附件审核页面上标注来源：单课程/系列课程/系列课程下的某课时
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 带来源信息的待审核附件列表及总数
   */
  async findPendingWithSource(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: AttachmentWithSource[]; total: number }> {
    try {
      // Step 1: 获取待审核附件记录
      const [attachments, total] = await this.attachmentRepository.findAndCount({
        where: { status: AttachmentStatus.PENDING, isDeleted: false },
        order: { createdAt: 'ASC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      if (attachments.length === 0) {
        return { items: [], total: 0 };
      }

      // Step 2: 通过 EntityManager 获取 Course/Lesson 的 Repository
      // （不依赖 Module import，避免循环依赖）
      const manager = this.attachmentRepository.manager;

      // 批量查询课程信息
      const coursesMap = new Map<number, { title: string; courseType: string }>();
      if (attachments.length > 0) {
        const ids = [...new Set(attachments.map((a) => a.courseId))];
        for (const courseId of ids) {
          const rows: any[] = await manager.query(
            'SELECT title, courseType FROM courses WHERE id = ?',
            [courseId],
          );
          if (rows.length > 0) {
            coursesMap.set(courseId, {
              title: rows[0].title,
              courseType: rows[0].courseType,
            });
          }
        }
      }

      // 批量查询课时信息
      const lessonsMap = new Map<number, { lessonTitle: string; chapterTitle: string }>();
      const needLesson = attachments.filter((a) => a.lessonId != null);
      for (const att of needLesson) {
        const rows: any[] = await manager.query(
          'SELECT l.title AS ltitle, c.title AS ctitle FROM lessons l LEFT JOIN chapters c ON c.id = l.chapterId WHERE l.id = ?',
          [att.lessonId],
        );
        if (rows.length > 0) {
          lessonsMap.set(att.lessonId!, {
            lessonTitle: rows[0].ltitle || null,
            chapterTitle: rows[0].ctitle || null,
          });
        }
      }

      // Step 3: 合并数据
      const items: AttachmentWithSource[] = attachments.map((att) => {
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
    } catch (error) {
      this.logger.error(`findPendingWithSource 查询失败: ${(error as Error).message}`, error);
      throw new InternalServerErrorException('获取待审核附件失败');
    }
  }

  /**
   * 审核附件（通过/驳回）
   * @param id - 附件ID
   * @param reviewerId - 审核人ID
   * @param status - 审核结果
   * @param reviewComment - 审核意见（驳回时必填）
   * @returns 更新后的附件记录
   */
  async review(
    id: number,
    reviewerId: number,
    status: AttachmentStatus.APPROVED | AttachmentStatus.REJECTED,
    reviewComment?: string,
  ): Promise<Attachment> {
    const attachment = await this.findOne(id);
    if (attachment.status !== AttachmentStatus.PENDING) {
      throw new ForbiddenException('该附件已审核，不能重复审核');
    }
    if (status === AttachmentStatus.REJECTED && !reviewComment) {
      throw new ForbiddenException('驳回附件时必须填写审核意见');
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

  /**
   * 获取附件下载地址（签名URL，有时效性）
   * @param id - 附件ID
   * @param requireApproved - 是否需要审核通过才能下载（默认 true）
   * @param expiry - 签名过期时间（秒），默认3600
   * @returns 临时下载URL
   */
  async getDownloadUrl(
    id: number,
    requireApproved: boolean = true,
    expiry: number = 3600,
  ): Promise<string> {
    const attachment = await this.findOne(id);
    // 如果要求审核通过，检查状态
    if (requireApproved && attachment.status !== AttachmentStatus.APPROVED) {
      throw new ForbiddenException('附件未通过审核，无法下载');
    }
    return this.storageService.getPresignedUrl(attachment.objectName, expiry);
  }

  /**
   * 软删除附件（仅上传者和管理员可操作）
   * @param id - 附件ID
   * @param userId - 操作用户ID
   * @param isSuperAdmin - 是否为超级管理员（管理员可删除任何附件，普通用户只能删自己的）
   */
  async softDelete(id: number, userId: number, isSuperAdmin: boolean = false): Promise<void> {
    const attachment = await this.findOne(id);
    if (attachment.userId !== userId && !isSuperAdmin) {
      throw new NotFoundException('无权操作此附件');
    }
    await this.attachmentRepository.update(id, { isDeleted: true });
    this.logger.log(`附件已软删除: id=${id}`);
  }

  /**
   * 上传附件文件到 MinIO 并创建数据库记录
   * 功能描述：接收 Express.Multer.File 对象，将文件上传到 MinIO 的 attachments/ 目录下，
   * 生成唯一文件名，创建对应的附件数据库记录（初始状态为待审核）
   * @param userId - 上传者用户ID
   * @param file - Express.Multer.File 对象
   * @param uploadDto - 附件上传元数据（课程ID、附件类型等）
   * @returns 创建的附件记录
   * @throws InternalServerErrorException 当文件上传或数据库保存失败时抛出
   */
  async uploadFile(
    userId: number,
    file: Express.Multer.File,
    uploadDto: UploadAttachmentDto,
  ): Promise<Attachment> {
    try {
      // 生成唯一对象名称：attachments/{courseId}/{uuid}{ext}
      const ext = extname(file.originalname);
      const objectName = `attachments/${uploadDto.courseId}/${randomUUID()}${ext}`;

      // 上传文件到 MinIO
      await this.storageService.uploadFile(
        objectName,
        file.buffer,
        file.size,
        file.mimetype,
      );

      // 创建数据库记录
      const newAttachment = this.attachmentRepository.create({
        userId,
        courseId: uploadDto.courseId,
        lessonId: uploadDto.lessonId || null,
        originalName: file.originalname,
        objectName,
        fileSize: file.size,
        mimeType: file.mimetype,
        attachmentType: uploadDto.attachmentType || AttachmentType.OTHER,
        status: AttachmentStatus.PENDING,
      } as any);
      const saved = await this.attachmentRepository.save(newAttachment as any);
      this.logger.log(`附件文件上传成功: id=${saved.id}, courseId=${saved.courseId}, name=${saved.originalName}, size=${file.size}`);
      return saved;
    } catch (error) {
      this.logger.error(`附件文件上传失败: userId=${userId}, name=${file.originalname}`, error);
      throw new InternalServerErrorException('附件文件上传失败，请稍后重试');
    }
  }

  /**
   * 获取指定课时的附件列表
   * 功能描述：查询挂在指定 lessonId 下的所有附件（含未审核的，供教师端使用）
   * @param lessonId - 课时ID
   * @returns 附件列表
   */
  async findByLesson(lessonId: number): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { lessonId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取课程已审核通过的附件列表（供学生端展示）
   * 功能描述：仅返回状态为 APPROVED 的附件，未审核/驳回的附件对学生不可见
   * @param courseId - 课程ID
   * @returns 已审核通过的附件列表
   */
  async findApprovedByCourse(courseId: number): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: {
        courseId,
        isDeleted: false,
        status: AttachmentStatus.APPROVED,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取指定课时已审核通过的附件列表（供学生端展示）
   * @param lessonId - 课时ID
   * @returns 已审核通过的附件列表
   */
  async findApprovedByLesson(lessonId: number): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: {
        lessonId,
        isDeleted: false,
        status: AttachmentStatus.APPROVED,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 物理删除附件及其存储文件
   * @param id - 附件ID
   */
  async hardDelete(id: number): Promise<void> {
    const attachment = await this.findOne(id);
    // 从 MinIO 删除文件
    await this.storageService.deleteFile(attachment.objectName);
    // 删除数据库记录
    await this.attachmentRepository.delete(id);
    this.logger.log(`附件已物理删除: id=${id}`);
  }
}
