import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 购物车实体
 * 功能描述：存储用户添加到购物车的课程记录，一个用户可以有多个购物车项
 * 每个购物车项记录用户ID + 课程ID，通过 unique 约束防止重复添加同一课程
 */
@Entity('cart_items')
export class CartItem {
  /** 购物车项ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户ID */
  @Column()
  userId: number;

  /** 课程ID */
  @Column()
  courseId: number;

  /** 数量（当前固定为1，保留扩展性） */
  @Column({ default: 1 })
  quantity: number;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
