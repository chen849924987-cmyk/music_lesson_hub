import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Chapter } from './entities/chapter.entity';
import { Video } from '../videos/entities/video.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { BusinessException } from '../../common/dto/response.dto';

/**
 * 课时服务
 * 功能描述：处理课时的管理逻辑，包括创建、编辑、排序、删除等
 *           创建/更新课时时自动从 Video 表读取 duration 并填充
 */
@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  /**
   * 创建课时
   * - 系列课程下：courseId + chapterId
   * - 单课程下：courseId，chapterId 为 null
   *
   * 自动处理：
   * - 如果传了 videoId，校验视频是否存在
   * - 如果传了 videoId 但没传 duration 或 duration 为 0，自动从 video 表读取
   * @param courseId 课程ID
   * @param createLessonDto 创建课时参数
   * @returns 创建的课时信息
   */
  async create(courseId: number, createLessonDto: CreateLessonDto): Promise<Lesson> {
    // 如果指定了章节ID，校验章节是否存在
    if (createLessonDto.chapterId) {
      const chapter = await this.chapterRepository.findOne({
        where: { id: createLessonDto.chapterId },
      });
      if (!chapter) {
        throw BusinessException.badRequest('章节不存在');
      }
    }

    // 如果传了 videoId，校验视频是否存在，并自动填充 duration
    if (createLessonDto.videoId) {
      const video = await this.videoRepository.findOne({
        where: { id: createLessonDto.videoId, isDeleted: false },
      });
      if (!video) {
        throw BusinessException.badRequest('关联的视频不存在');
      }
      // 如果前端没有传 duration 或传了 0，自动从视频表读取
      if (!createLessonDto.duration || createLessonDto.duration === 0) {
        createLessonDto.duration = video.duration || 0;
      }
    }

    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      courseId,
    });
    return this.lessonRepository.save(lesson);
  }

  /**
   * 根据ID查询课时
   * @param id 课时ID
   * @returns 课时信息
   */
  async findById(id: number): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['chapter'],
    });
    if (!lesson) {
      throw BusinessException.notFound('课时不存在');
    }
    return lesson;
  }

  /**
   * 获取课程下的所有课时列表
   * @param courseId 课程ID
   * @returns 课时列表
   */
  async findByCourseId(courseId: number): Promise<Lesson[]> {
    return this.lessonRepository.find({
      where: { courseId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 获取章节下的所有课时列表
   * @param chapterId 章节ID
   * @returns 课时列表
   */
  async findByChapterId(chapterId: number): Promise<Lesson[]> {
    return this.lessonRepository.find({
      where: { chapterId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 更新课时信息
   *
   * 自动处理：
   * - 如果更新了 videoId，校验视频是否存在
   * - 如果更新了 videoId 但没传 duration 或 duration 为 0，自动从 video 表读取
   * @param id 课时ID
   * @param updateLessonDto 要更新的字段
   * @returns 更新后的课时信息
   */
  async update(id: number, updateLessonDto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.findById(id);

    // 如果更新了 videoId 且为有效值（> 0），校验视频是否存在并自动填充 duration
    if (updateLessonDto.videoId && updateLessonDto.videoId > 0) {
      const video = await this.videoRepository.findOne({
        where: { id: updateLessonDto.videoId, isDeleted: false },
      });
      if (!video) {
        throw BusinessException.badRequest('关联的视频不存在');
      }
      // 如果前端没有传 duration 或传了 0，自动从视频表读取
      if (!updateLessonDto.duration || updateLessonDto.duration === 0) {
        updateLessonDto.duration = video.duration || 0;
      }
    }
    // videoId 为 0 或空值 => 清除视频关联
    if (updateLessonDto.videoId === 0 || updateLessonDto.videoId === undefined || updateLessonDto.videoId === null) {
      // 允许前端传 videoId: 0 来清除关联
    }

    Object.assign(lesson, updateLessonDto);
    return this.lessonRepository.save(lesson);
  }

  /**
   * 删除课时
   * @param id 课时ID
   */
  async remove(id: number): Promise<void> {
    const lesson = await this.findById(id);
    await this.lessonRepository.remove(lesson);
  }

  /**
   * 更新课时排序
   * @param id 课时ID
   * @param sortOrder 新的排序值
   * @returns 更新后的课时信息
   */
  async updateSortOrder(id: number, sortOrder: number): Promise<Lesson> {
    const lesson = await this.findById(id);
    lesson.sortOrder = sortOrder;
    return this.lessonRepository.save(lesson);
  }
}
