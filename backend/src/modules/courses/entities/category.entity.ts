import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 课程分类实体
 * 功能描述：存储课程分类信息，用于对课程进行归类管理
 */
@Entity('categories')
export class Category {
  /** 分类ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 分类名称，例如：吉他、钢琴、声乐 */
  @Column({ length: 50 })
  name: string;

  /** 分类图标URL */
  @Column({ length: 500, default: '' })
  icon: string;

  /** 排序权重，数值越小越靠前 */
  @Column({ default: 0 })
  sortOrder: number;

  /** 是否启用：true-启用 false-禁用 */
  @Column({ default: true })
  isActive: boolean;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
