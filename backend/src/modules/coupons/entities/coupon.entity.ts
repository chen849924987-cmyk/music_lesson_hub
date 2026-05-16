import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CouponType } from '../../../common/constants';

/**
 * 优惠券实体
 * 功能描述：存储优惠券定义信息，包括类型、面值、使用门槛、有效期、库存等
 *
 * 优惠券类型：
 * - fixed（满减券）：按固定金额减免，如满100减20
 * - percentage（折扣券）：按百分比折扣，如8折（即discount=20，表示减20%）
 *
 * @property code 优惠券码，唯一标识，用户可输入领取
 * @property discount 面值（满减券为减免金额，单位：分）/ 折扣值（折扣券为折扣百分比）
 * @property minAmount 最低使用门槛（单位：分），0表示无门槛
 * @property maxDiscount 折扣券最大减免金额（单位：分），null表示不限制
 * @property totalCount 总发放数量，-1表示不限量
 * @property perUserLimit 每人限领数量，0表示不限制
 * @property remainingCount 剩余可领取数量
 * @property startTime 有效期开始时间
 * @property endTime 有效期结束时间
 */
@Entity('coupons')
export class Coupon {
  /** 优惠券ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 优惠券名称（如"新人优惠券"、"暑期特惠"） */
  @Column({ length: 100 })
  name: string;

  /** 优惠券码（唯一标识，用户可输入领取） */
  @Column({ length: 32, unique: true })
  code: string;

  /** 优惠券类型：fixed-满减券 percentage-折扣券 */
  @Column({
    type: 'enum',
    enum: CouponType,
  })
  type: CouponType;

  /**
   * 优惠面值
   * - 满减券（fixed）：减免金额，单位：分。如 2000 表示减免 20 元
   * - 折扣券（percentage）：折扣百分比。如 10 表示 9折（减10%），20 表示 8折（减20%）
   */
  @Column({ type: 'int' })
  discount: number;

  /** 最低使用门槛（单位：分），0表示无门槛 */
  @Column({ type: 'int', default: 0 })
  minAmount: number;

  /**
   * 折扣券最大减免金额（单位：分）
   * 仅折扣券类型有效，限制最大优惠金额
   * null 表示不限制
   */
  @Column({ type: 'int', nullable: true })
  maxDiscount: number;

  /** 总发放数量（-1表示不限量） */
  @Column({ type: 'int', default: -1 })
  totalCount: number;

  /** 每人限领数量（0表示不限制） */
  @Column({ type: 'int', default: 1 })
  perUserLimit: number;

  /** 剩余可领取数量 */
  @Column({ type: 'int', default: -1 })
  remainingCount: number;

  /** 有效期开始时间 */
  @Column({ type: 'datetime' })
  startTime: Date;

  /** 有效期结束时间 */
  @Column({ type: 'datetime' })
  endTime: Date;

  /** 是否启用 */
  @Column({ default: true })
  isActive: boolean;

  /** 优惠券描述（使用说明） */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
