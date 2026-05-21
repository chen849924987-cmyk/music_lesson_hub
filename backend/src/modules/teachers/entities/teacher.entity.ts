import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WithdrawalStatus } from '../../../common/constants';

/**
 * 教师实体
 * 功能描述：存储教师的详细信息，与用户表通过 userId 一对一关联
 * 教师必须先有 User 账号（由管理员创建），再补充教师信息
 */
@Entity('teachers')
export class Teacher {
  /** 教师记录ID */
  @PrimaryGeneratedColumn()
  id: number;

  /** 关联的用户ID */
  @Column()
  userId: number;

  /** 关联的用户信息 */
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /** 教师真实姓名 */
  @Column({ length: 50 })
  realName: string;

  /** 个人简介 */
  @Column({ type: 'text', nullable: true })
  introduction: string;

  /** 擅长领域/标签，逗号分隔 */
  @Column({ length: 500, default: '' })
  specialties: string;

  /** 教师头像 */
  @Column({ length: 500, default: '' })
  avatar: string;

  /** 联系方式 */
  @Column({ length: 200, default: '' })
  contactInfo: string;

  /** 收款账号（支付宝账号/手机号） */
  @Column({ length: 200, default: '' })
  paymentAccount: string;

  /** 银行账号 */
  @Column({ length: 200, default: '' })
  bankAccount: string;

  /** 所属支行 */
  @Column({ length: 200, default: '' })
  bankBranch: string;

  /** 通知偏好（是否接收课程审核通知等） */
  @Column({ default: true })
  notificationEnabled: boolean;

  /** 总收入（单位：分，防止浮点数精度问题） */
  @Column({ type: 'bigint', default: 0 })
  totalEarnings: number;

  /** 可提现余额（单位：分） */
  @Column({ type: 'bigint', default: 0 })
  withdrawableBalance: number;

  /** 已提现金额（单位：分） */
  @Column({ type: 'bigint', default: 0 })
  withdrawnAmount: number;

  /** 审核状态：true-已认证 false-待认证 */
  @Column({ default: false })
  isVerified: boolean;

  /** 数据统计：课程总数 */
  @Column({ default: 0 })
  courseCount: number;

  /** 数据统计：学员总数 */
  @Column({ default: 0 })
  studentCount: number;

  /** 数据统计：总评分 */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
