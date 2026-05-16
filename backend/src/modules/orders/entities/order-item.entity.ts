import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

/**
 * 订单明细实体
 * 功能描述：记录订单中的每个课程项，支持一笔订单购买多个课程
 * @property price 购买时的课程单价（单位：分），记录历史价格防止课程调价后数据不一致
 */
@Entity('order_items')
export class OrderItem {
  /** 明细ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 关联的订单ID */
  @Column()
  orderId: number;

  /** 关联的订单 */
  @ManyToOne(() => Order, (order: Order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

/** 课程ID */
  @Column()
  courseId: number;

  /** 课时ID（单独购买课时时记录，购买完整课程时为 null） */
  @Column({ nullable: true })
  lessonId: number;

  /** 课时标题（单独购买课时时冗余存储） */
  @Column({ length: 200, nullable: true })
  lessonTitle: string;

  /** 课程标题（冗余存储，防止课程信息变更后订单数据不准确） */
  @Column({ length: 200 })
  courseTitle: string;

  /** 购买时的课程单价（单位：分） */
  @Column({ type: 'int' })
  price: number;

  /** 购买数量（当前固定为1，保留扩展性） */
  @Column({ default: 1 })
  quantity: number;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;
}
