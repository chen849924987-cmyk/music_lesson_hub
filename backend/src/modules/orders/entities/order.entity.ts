import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus, OrderType, PaymentMethod } from '../../../common/constants';

/**
 * 订单实体
 * 功能描述：存储订单主表信息，包含订单号、用户、金额、状态等核心字段。
 * 订单状态流转：pending(待支付) → paid(已支付) → completed(已完成) / refunding(退款中) → refunded(已退款)
 *              pending(待支付) → cancelled(已取消)
 * @property orderNo 唯一订单号，格式：ORD + 时间戳 + 随机数
 * @property totalAmount 订单总金额（单位：分），使用整数防止浮点精度问题
 */
@Entity('orders')
export class Order {
  /** 订单ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 关联的下单用户 */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /** 唯一订单号（ORD + 14位时间戳 + 6位随机数） */
  @Column({ length: 64, unique: true })
  orderNo: string;

  /** 下单用户ID（关联 users 表） */
  @Column()
  userId: number;

  /** 订单总金额（单位：分） */
  @Column({ type: 'int' })
  totalAmount: number;

  /** 订单状态：pending-待支付 paid-已支付 refunded-已退款 refunding-退款中 cancelled-已取消 */
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  /** 订单类型：single_course-单课程 series_course-系列课程 bundle-捆绑包 */
  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.SINGLE_COURSE,
  })
  orderType: OrderType;

  /** 支付方式：alipay-支付宝 wechat-微信支付（预留） */
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  /** 支付宝交易号（支付成功后回填） */
  @Column({ length: 64, nullable: true })
  tradeNo: string;

  /** 支付时间 */
  @Column({ nullable: true })
  paidAt: Date;

  /** 订单过期时间（待支付订单超过30分钟自动取消） */
  @Column({ nullable: true })
  expiredAt: Date;

  /** 订单备注（退款原因、驳回原因等） */
  @Column({ type: 'text', nullable: true })
  remark: string;

  /** 订单明细项 */
  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
