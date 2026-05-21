import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from './course.entity';

/**
 * 课程评价实体
 * 功能描述：存储制作人对课程的评价，包含评分、评价内容、教师回复等。
 *          每个用户每门课程只能发表一条评价。
 *
 * 评分规则：
 * - rating：1~5 星，整数
 * - isPurchased：标记该评价是否来自已购用户
 * - 只有 isPurchased=true 的评价才会计入课程平均评分（course.rating）
 *   和评价数（course.reviewCount），未购用户的评价仅展示但不计入总评
 */
@Entity('evaluations')
export class Evaluation {
  /** 评价ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 课程ID（关联 courses 表） */
  @Column()
  courseId: number;

  /** 制作人/评价人ID（关联 users 表） */
  @Column()
  userId: number;

  /** 评分：1~5 星，整数 */
  @Column({ type: 'tinyint', default: 5 })
  rating: number;

  /** 评价内容（文字） */
  @Column({ type: 'text', nullable: true })
  content: string;

  /** 教师回复内容 */
  @Column({ type: 'text', nullable: true })
  replyContent: string;

  /** 教师回复时间 */
  @Column({ nullable: true })
  repliedAt: Date;

  /** 评价是否可见（管理员可屏蔽不合适评价） */
  @Column({ default: true })
  isVisible: boolean;

  /**
   * 是否为已购用户的评价
   * 功能描述：true 表示评价用户已购买该课程，计入总评分；
   *          false 表示未购用户的评价，仅展示但不计入总评分。
   *          前端展示时会根据此字段显示"已购"标识。
   */
  @Column({ default: false })
  isPurchased: boolean;

  // ============ 关联关系 ============

  /** 课程信息 */
  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  /** 评价用户信息 */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /** 创建时间（即评价发表时间） */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
