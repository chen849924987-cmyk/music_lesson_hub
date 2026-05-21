import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { EarningStatus } from '../../../common/constants';

/**
 * 收益记录实体
 * 功能描述：记录每一笔收益流水，包括课程销售收益、提现扣减等。
 *          每笔订单支付成功后自动生成一条或多条收益记录（按课程归属教师拆分）。
 *          提现操作也会生成对应的扣减记录，便于完整审计追踪。
 *
 * @property teacherId 收益归属教师ID（关联 teachers 表）
 * @property orderId 关联订单ID（收益来源订单）
 * @property courseId 关联课程ID（收益来源课程）
 * @property amount 收益金额（单位：分，正数为收入，负数为扣减）
 * @property actualAmount 实际到账金额（单位：分，扣除平台分成后的金额）
 * @property status 收益状态：pending-待结算 settled-已结算 withdrawn-已提现
 * @property type 收益类型：course_sale-课程销售 withdrawal-提现扣减 refund-退款扣减
 * @property remark 备注信息（如课程名称、提现单号等）
 */
@Entity('earnings')
export class Earning {
  /** 收益记录ID */
  @PrimaryGeneratedColumn()
  id: number;

  /** 收益归属教师ID（关联 teachers 表） */
  @Column()
  teacherId: number;

  /** 关联订单ID（提现/退款记录可为空） */
  @Column({ nullable: true })
  orderId: number;

  /** 关联订单项ID（可精确到课程/课时维度） */
  @Column({ nullable: true })
  orderItemId: number;

  /** 关联课程ID（提现记录可为空） */
  @Column({ nullable: true })
  courseId: number;

  /** 课程标题（冗余存储，防止课程名变更后数据不一致） */
  @Column({ length: 200 })
  courseTitle: string;

  /** 收益金额（单位：分，正数=收入，负数=扣减） */
  @Column({ type: 'int' })
  amount: number;

  /** 平台分成金额（单位：分） */
  @Column({ type: 'int', default: 0 })
  platformShare: number;

  /** 实际到账金额（单位：分 = amount - platformShare） */
  @Column({ type: 'int' })
  actualAmount: number;

  /** 收益类型：course_sale-课程销售 withdrawal-提现扣减 refund-退款扣减 */
  @Column({ length: 32, default: 'course_sale' })
  type: string;

  /** 收益状态：pending-待结算 settled-已结算 */
  @Column({
    type: 'enum',
    enum: EarningStatus,
    default: EarningStatus.SETTLED,
  })
  status: EarningStatus;

  /** 备注信息 */
  @Column({ type: 'text', nullable: true })
  remark: string;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;
}
