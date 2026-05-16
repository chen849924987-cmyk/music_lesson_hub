import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 视频实体
 * 功能描述：存储上传到 MinIO 的视频文件元信息，包括文件路径、大小、时长、转码状态等
 * 内容创作者上传视频后，系统将其存储在 MinIO 中，并在数据库中记录元数据
 */
@Entity('videos')
export class Video {
  /** 视频ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 上传者用户ID */
  @Column()
  userId: number;

  /** 视频原始文件名（用户上传时的文件名） */
  @Column({ length: 500 })
  originalName: string;

  /** 视频在 MinIO 中的存储路径（objectName） */
  @Column({ length: 500 })
  objectName: string;

  /** 视频文件大小（字节） */
  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  /** 视频 MIME 类型 */
  @Column({ length: 100, default: 'video/mp4' })
  mimeType: string;

  /** 视频时长（秒） */
  @Column({ default: 0 })
  duration: number;

  /** 视频宽度（像素） */
  @Column({ default: 0 })
  width: number;

  /** 视频高度（像素） */
  @Column({ default: 0 })
  height: number;

  /** 视频封面图在 MinIO 中的存储路径 */
  @Column({ length: 500, default: '' })
  coverObjectName: string;

  /** 转码状态：pending-待转码 processing-转码中 completed-已完成 failed-失败 */
  @Column({ length: 20, default: 'pending' })
  transcodeStatus: string;

  /** 转码后的各清晰度文件路径（JSON 数组字符串） */
  @Column({ type: 'text', nullable: true })
  transcodeOutputs: string;

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
