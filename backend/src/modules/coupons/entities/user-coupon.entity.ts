import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';

/**
 * 用户优惠券实体
 * 功能描述：记录用户领取的优惠券以及使用状态。每人每券一条记录。
 *
 * 状态流转：
 * - unused（未使用）→ used（已使用）/ expired（已过期）
 *
 * @property userId 用户ID
 * @property couponId 优惠券ID
 * @property status 使用状态：unused-未使用 used-已使用 expired-已过期
 * @property usedAt 使用时间
 * @property orderId 使用该优惠券的订单ID
 */
@Entity('user_coupons')
export class UserCoupon {
  /** 记录ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 关联的优惠券 */
  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  /** 用户ID */
  @Column()
  userId: number;

  /** 优惠券ID */
  @Column()
  couponId: number;

  /** 使用状态：unused-未使用 used-已使用 expired-已过期 */
  @Column({ length: 20, default: 'unused' })
  status: string;

  /** 使用时间 */
  @Column({ nullable: true })
  usedAt: Date;

  /** 使用该优惠券的订单ID */
  @Column({ nullable: true })
  orderId: number;

  /** 领取时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
