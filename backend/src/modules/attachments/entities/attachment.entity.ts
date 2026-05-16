import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttachmentType, AttachmentStatus } from '../../../common/constants';

/**
 * 附件实体
 * 功能描述：存储课程附件（课件、乐谱等）的元信息，包括文件路径、类型、审核状态等
 * 教师上传附件后，存储在 MinIO 中，需要经过审核才能被学员查看
 */
@Entity('attachments')
export class Attachment {
  /** 附件ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 上传者用户ID（教师） */
  @Column()
  userId: number;

  /** 关联的课程ID */
  @Column()
  courseId: number;

  /** 关联的课时ID（系列课程的课件挂在具体课时下，单课程此字段为 null） */
  @Column({ type: 'int', nullable: true })
  lessonId: number | null;

  /** 附件原始文件名 */
  @Column({ length: 500 })
  originalName: string;

  /** 附件在 MinIO 中的存储路径（objectName） */
  @Column({ length: 500 })
  objectName: string;

  /** 附件文件大小（字节） */
  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  /** 附件 MIME 类型 */
  @Column({ length: 100, default: 'application/octet-stream' })
  mimeType: string;

  /** 附件类型：courseware-课件 score-乐谱 other-其他 */
  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.COURSEWARE,
  })
  attachmentType: AttachmentType;

  /** 附件审核状态：pending-待审核 approved-已通过 rejected-已驳回 */
  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.PENDING,
  })
  status: AttachmentStatus;

  /** 审核意见（驳回时填写原因） */
  @Column({ length: 500, default: '' })
  reviewComment: string;

  /** 审核人ID */
  @Column({ nullable: true })
  reviewerId: number;

  /** 审核时间 */
  @Column({ nullable: true })
  reviewedAt: Date;

  /** 是否已删除（软删除标记） */
  @Column({ default: false })
  isDeleted: boolean;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
