import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 用户-课时购买关系实体
 * 功能描述：记录用户单独购买课时的关联关系，用于校验用户是否有权播放单独购买的课时
 * 注意：用户购买完整系列课会写入 user_courses 表，购买单独课时写入此表
 */
@Entity('user_lessons')
export class UserLesson {
  /** 记录ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户ID（关联 users 表） */
  @Column()
  userId: number;

  /** 课时ID（关联 lessons 表） */
  @Column()
  lessonId: number;

  /** 所属课程ID（冗余字段，便于查询） */
  @Column()
  courseId: number;

  /** 订单ID（关联 orders 表） */
  @Column({ nullable: true })
  orderId: number;

  /** 购买金额（单位：分） */
  @Column({ type: 'int', default: 0 })
  price: number;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
