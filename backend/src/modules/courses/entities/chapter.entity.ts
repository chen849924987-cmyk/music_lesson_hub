import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

/**
 * 章节实体
 * 功能描述：系列课程（series）下的章节分组，每个章节可以包含多个课时
 * 单课程（single）不包含章节
 */
@Entity('chapters')
export class Chapter {
  /** 章节ID，自增主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 所属课程ID */
  @Column()
  courseId: number;

  /** 关联的课程信息 */
  @ManyToOne(() => Course, (course) => course.chapters)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  /** 章节标题 */
  @Column({ length: 200 })
  title: string;

  /** 章节描述 */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 排序权重，数值越小越靠前 */
  @Column({ default: 0 })
  sortOrder: number;

  /** 该章节下的课时列表 */
  @OneToMany(() => Lesson, (lesson) => lesson.chapter)
  lessons: Lesson[];

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
