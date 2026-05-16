/**
 * LearningProgress 学习进度实体
 *
 * 功能描述：记录用户在课程/课时中的学习进度，支持断点续播和进度追踪。
 *
 * @字段说明：
 * - userId: 用户ID，关联 users 表
 * - courseId: 课程ID，关联 courses 表
 * - lessonId: 课时ID，关联 lessons 表
 * - progress: 视频播放进度百分比（0~100）
 * - lastPosition: 上次播放位置（秒），用于断点续播
 * - duration: 课时视频总时长（秒），用于计算进度百分比
 * - completed: 是否已完成（进度 >= 95% 视为完成）
 * - completedAt: 完成时间
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('learning_progress')
@Index(['userId', 'lessonId'], { unique: true }) // 每个用户每个课时只有一条进度记录
@Index(['userId', 'courseId']) // 按用户+课程查询进度时加速
export class LearningProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'userId', type: 'int', nullable: false })
  userId: number;

  @Column({ name: 'courseId', type: 'int', nullable: false })
  courseId: number;

  @Column({ name: 'lessonId', type: 'int', nullable: false })
  lessonId: number;

  /**
   * 视频播放进度百分比（0~100）
   * 每30秒或暂停时更新
   */
  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  progress: number;

  /**
   * 上次播放位置（秒）
   * 用于断点续播，视频加载后自动跳转到此位置
   */
  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0 })
  lastPosition: number;

  /**
   * 课时视频总时长（秒）
   * 用于计算进度百分比
   */
  @Column({ type: 'int', default: 0 })
  duration: number;

  /**
   * 是否已完成当前课时
   * progress >= 95 时自动标记为 true
   */
  @Column({ default: false })
  completed: boolean;

  /** 完成时间（首次达到100%时记录） */
  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  /** 播放次数统计 */
  @Column({ type: 'int', default: 0 })
  playCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
