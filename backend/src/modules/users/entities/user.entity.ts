import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Role } from '../../../common/constants';
import { Teacher } from '../../teachers/entities/teacher.entity';

/**
 * 用户实体
 * 功能描述：存储所有用户（学员/管理员/审核员）的基础账号信息
 * 教师信息存储在 teacher 表中，通过 userId 一对一关联
 */
@Entity('users')
export class User {
  /** 用户ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 关联的教师信息（仅教师角色有值） */
  @OneToOne(() => Teacher, (teacher) => teacher.user)
  teacher: Teacher;

  /** 用户名，唯一索引，用于登录 */
  @Column({ length: 50, unique: true })
  username: string;

  /** 密码（经过 bcrypt 加密） */
  @Column({ length: 200, select: false })
  password: string;

  /** 用户昵称 */
  @Column({ length: 50, default: '' })
  nickname: string;

  /** 用户角色 */
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role;

  /** 手机号 */
  @Column({ length: 20, default: '' })
  phone: string;

  /** 邮箱 */
  @Column({ length: 100, default: '' })
  email: string;

  /** 头像URL */
  @Column({ length: 500, default: '' })
  avatar: string;

  /** 个人简介 */
  @Column({ type: 'text', nullable: true })
  bio: string;

  /** 账号状态：true-启用 false-禁用 */
  @Column({ default: true })
  isActive: boolean;

  /** 最后登录时间 */
  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
