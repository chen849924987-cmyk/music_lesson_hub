import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from '../../teachers/entities/teacher.entity';

/**
 * 提现申请实体
 * 功能描述：存储教师的提现申请记录，包含申请金额、状态、审核信息等。
 *          提现流程：教师申请 → 管理员审核 → 通过（打款）/ 驳回
 *
 * 状态流转：
 * - pending（待审核）：教师提交申请后
 * - approved（已通过/已到账）：管理员审核通过，标记为已打款
 * - rejected（已驳回）：管理员审核不通过，需填写驳回原因
 *
 * 金额规则：
 * - amount：申请金额，单位"分"
 * - 申请时需校验教师 withdrawableBalance 是否足够
 * - 审核通过后扣除教师 withdrawableBalance，增加 withdrawnAmount
 * - 审核驳回后恢复教师 withdrawableBalance
 */
@Entity('withdrawals')
export class Withdrawal {
  /** 提现申请ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 教师ID（关联 teachers 表） */
  @Column()
  teacherId: number;

  /** 申请提现金额（单位：分） */
  @Column({ type: 'int' })
  amount: number;

  /** 提现状态：pending-待审核 approved-已到账 rejected-已驳回 */
  @Column({ length: 20, default: 'pending' })
  status: string;

  /** 收款账号信息（支付宝账号） */
  @Column({ length: 200, default: '' })
  accountInfo: string;

  /** 审核人ID（关联 users 表） */
  @Column({ nullable: true })
  reviewerId: number;

  /** 审核意见/驳回原因 */
  @Column({ type: 'text', nullable: true })
  remark: string;

  /** 处理时间（审核通过/驳回的时间） */
  @Column({ nullable: true })
  processedAt: Date;

  // ============ 关联关系 ============

  /** 教师信息 */
  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  /** 创建时间（即申请时间） */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
