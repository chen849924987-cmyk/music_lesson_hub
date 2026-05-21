import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Category } from './category.entity';
import { Chapter } from './chapter.entity';
import { CourseType, CourseStatus } from '../../../common/constants';

/**
 * 课程实体
 * 功能描述：存储课程基本信息，支持单课程（single）和系列课程（series）两种类型。
 * 包含审核相关字段（reviewComment、reviewerId、reviewedAt）、
 * 已上架课程编辑标记（pendingEdit）、推荐/置顶标记（isFeatured）、
 * 预告视频引用（trailerVideoId）和变更快照（previousData）。
 */
@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 500, default: '' })
  cover: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  teacherId: number;

  @Column({ type: 'enum', enum: CourseType, default: CourseType.SINGLE })
  courseType: CourseType;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  originalPrice: number;

  /**
   * 课程状态
   * 功能描述：索引该字段以加速按状态筛选的查询（如 findPublished 按 approved 筛选）
   */
  @Index()
  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  status: CourseStatus;

  @Column({ default: 0 })
  previewDuration: number;

  @Column({ nullable: true })
  trailerVideoId: number;

  @Column({ type: 'text', nullable: true })
  reviewComment: string;

  @Column({ nullable: true })
  reviewerId: number;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ default: false })
  pendingEdit: boolean;

  @Column({ default: false })
  pendingOffShelf: boolean;

  @Column({ length: 500, default: '' })
  tags: string;

  @Column({ default: 0 })
  studentCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: false })
  isRecommended: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  /**
   * 变更快照（JSON 文本）
   * 功能描述：已上架课程提交编辑审核时，保存旧版本的关键字段快照。
   *          审核员可通过对比快照和当前数据了解哪些内容被修改。
   * @格式：{"title":"旧标题","price":9900,"description":"旧简介", ...}
   */
  @Column({ name: 'previousData', type: 'text', nullable: true })
  previousData: string;

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
