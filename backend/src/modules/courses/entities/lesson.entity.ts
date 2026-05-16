import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Chapter } from './chapter.entity';

/**
 * 课时实体
 * 功能描述：存储课程下每个课时的信息，包括标题、时长、视频关联、试看时长等。
 * 系列课程下归属于章节（chapter），单课程可直接归属于课程（通过 chapterId 为 null 标识）。
 * previewDuration 为课时级试看时长（秒级），覆盖课程级设置，0 表示使用课程级默认值。
 */
@Entity('lessons')
export class Lesson {
  /** 课时ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 所属章节ID，单课程此字段为 null */
  @Column({ nullable: true })
  chapterId: number;

  /** 关联的章节信息 */
  @ManyToOne(() => Chapter, (chapter) => chapter.lessons)
  @JoinColumn({ name: 'chapterId' })
  chapter: Chapter;

  /** 课程ID（冗余字段，用于单课程直接关联） */
  @Column()
  courseId: number;

  /** 课时标题 */
  @Column({ length: 200 })
  title: string;

  /** 课时描述 */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 视频时长（秒） */
  @Column({ default: 0 })
  duration: number;

  /** 关联的视频ID（视频模块） */
  @Column({ nullable: true })
  videoId: number;

  /** 是否免费试看 */
  @Column({ default: false })
  isFree: boolean;

  /**
   * 课时级试看时长（秒）
   * 覆盖课程级 previewDuration 设置
   * 0 或 null 表示使用课程级默认试看时长
   */
  @Column({ default: 0 })
  previewDuration: number;

  /**
   * 是否支持单独购买（仅对系列课内的课时生效）
   * 默认 false，表示不支持单独购买
   * 教师可以在创建或编辑课时时设置
   */
  @Column({ default: false })
  canSinglePurchase: boolean;

  /**
   * 单独购买价格（单位：分）
   * 仅当 canSinglePurchase = true 时生效
   * 支持单独购买时必填，须大于 0
   */
  @Column({ type: 'int', default: 0 })
  singlePrice: number;

  /** 排序权重，数值越小越靠前 */
  @Column({ default: 0 })
  sortOrder: number;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
