import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * 课程审核记录实体
 * 功能描述：记录每次课程审核操作的详细信息，包括审核人、审核动作、审核意见等
 * 每次审核（通过/驳回）都会生成一条记录，用于追溯审核历史
 */
@Entity('course_reviews')
export class CourseReview {
  /** 审核记录ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 被审核的课程ID */
  @Column()
  courseId: number;

  /** 审核人ID（关联 users 表） */
  @Column()
  reviewerId: number;

  /** 审核动作：approved-通过 rejected-驳回 */
  @Column({ length: 20 })
  action: 'approved' | 'rejected';

  /** 审核意见/驳回原因（驳回时必填） */
  @Column({ type: 'text', nullable: true })
  comment: string;

  /** 审核时的课程状态快照（审核前的状态） */
  @Column({ length: 20, nullable: true })
  previousStatus: string;

  /** 审核后的课程状态 */
  @Column({ length: 20, nullable: true })
  newStatus: string;

  /** 创建时间（即审核时间） */
  @CreateDateColumn()
  createdAt: Date;
}
