import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 提现申请实体
 * 功能描述：记录教师提交的提现申请，管理员审核后完成打款
 *
 * @field id 主键ID
 * @field teacherId 教师用户ID（关联 users 表）
 * @field amount 提现金额（单位：分）
 * @field accountType 收款账户类型：alipay-支付宝
 * @field account 收款账号
 * @field status 提现状态：pending-待处理 completed-已打款 rejected-已驳回
 * @field reviewComment 审核备注（驳回原因）
 * @field reviewerId 审核员ID
 * @field reviewedAt 审核时间
 * @field createdAt 创建时间
 * @field updatedAt 更新时间
 */
@Entity('withdrawals')
@Index('idx_withdrawal_teacher', ['teacherId'])
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'teacher_id', type: 'int' })
  teacherId: number;

  @Column({ type: 'int', comment: '提现金额（单位：分）' })
  amount: number;

  @Column({ name: 'account_type', type: 'varchar', length: 20, default: 'alipay', comment: '收款账户类型' })
  accountType: string;

  @Column({ type: 'varchar', length: 100, comment: '收款账号' })
  account: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '提现状态：pending-待处理 completed-已打款 rejected-已驳回',
  })
  status: string;

  @Column({ name: 'review_comment', type: 'varchar', length: 500, nullable: true, comment: '审核备注' })
  reviewComment?: string;

  @Column({ name: 'reviewer_id', type: 'int', nullable: true })
  reviewerId?: number;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
