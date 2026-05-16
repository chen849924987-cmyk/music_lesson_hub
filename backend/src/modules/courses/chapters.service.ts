import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { Course } from './entities/course.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { BusinessException } from '../../common/dto/response.dto';

/**
 * 章节服务
 * 功能描述：处理系列课程下的章节管理逻辑，包括创建、排序、编辑、删除等
 */
@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  /**
   * 创建章节
   * @param courseId 课程ID
   * @param createChapterDto 创建章节参数
   * @returns 创建的章节信息
   */
  async create(courseId: number, createChapterDto: CreateChapterDto): Promise<Chapter> {
    // 校验课程是否存在
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw BusinessException.notFound('课程不存在');
    }

    // 计算该课程下最大 sortOrder，新章节排到最后
    const lastChapter = await this.chapterRepository.findOne({
      where: { courseId },
      order: { sortOrder: 'DESC' },
      select: ['sortOrder'],
    });
    const maxSortOrder = lastChapter?.sortOrder ?? 0;

    const chapter = this.chapterRepository.create({
      ...createChapterDto,
      courseId,
      sortOrder: (maxSortOrder ?? 0) + 1,
    });
    return this.chapterRepository.save(chapter);
  }

  /**
   * 根据ID查询章节
   * @param id 章节ID
   * @returns 章节信息（含课时的列表）
   */
  async findById(id: number): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
      relations: ['lessons'],
      order: { lessons: { sortOrder: 'ASC' } },
    });
    if (!chapter) {
      throw BusinessException.notFound('章节不存在');
    }
    return chapter;
  }

  /**
   * 获取课程下的所有章节列表
   * @param courseId 课程ID
   * @returns 章节列表（含课时）
   */
  async findByCourseId(courseId: number): Promise<Chapter[]> {
    return this.chapterRepository.find({
      where: { courseId },
      relations: ['lessons'],
      order: { sortOrder: 'ASC', lessons: { sortOrder: 'ASC' } },
    });
  }

  /**
   * 更新章节信息
   * @param id 章节ID
   * @param updateChapterDto 要更新的字段
   * @returns 更新后的章节信息
   */
  async update(id: number, updateChapterDto: UpdateChapterDto): Promise<Chapter> {
    const chapter = await this.findById(id);
    Object.assign(chapter, updateChapterDto);
    return this.chapterRepository.save(chapter);
  }

  /**
   * 删除章节
   * @param id 章节ID
   */
  async remove(id: number): Promise<void> {
    const chapter = await this.findById(id);
    await this.chapterRepository.remove(chapter);
  }

  /**
   * 更新章节排序
   * @param id 章节ID
   * @param sortOrder 新的排序值
   * @returns 更新后的章节信息
   */
  async updateSortOrder(id: number, sortOrder: number): Promise<Chapter> {
    const chapter = await this.findById(id);
    chapter.sortOrder = sortOrder;
    return this.chapterRepository.save(chapter);
  }
}
