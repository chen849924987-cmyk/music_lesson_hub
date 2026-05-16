import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 用户-课程购买关系实体
 * 功能描述：记录用户购买课程的关联关系，用于校验用户是否有权播放课程视频
 * 当用户完成订单支付后，在此表插入一条记录表示用户已购买该课程
 */
@Entity('user_courses')
export class UserCourse {
  /** 记录ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户ID（关联 users 表） */
  @Column()
  userId: number;

  /** 课程ID（关联 courses 表） */
  @Column()
  courseId: number;

  /** 订单ID（关联 orders 表，可为空，简化场景下直接插入） */
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
