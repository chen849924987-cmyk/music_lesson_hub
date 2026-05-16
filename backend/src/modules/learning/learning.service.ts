/**
 * LearningService 学习进度服务
 *
 * 功能描述：管理用户在学习课程时的进度记录，支持断点续播、进度追踪和完成度统计。
 *
 * @方法说明：
 * - updateProgress: 更新/创建课时学习进度（使用 upsert 避免并发冲突）
 * - getLessonProgress: 获取指定课时的学习进度（用于断点续播）
 * - getCourseProgress: 获取用户在某课程中的总学习进度统计
 * - getCourseLessonProgresses: 获取用户在某课程中所有课时的进度列表
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningProgress } from './entities/learning-progress.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    @InjectRepository(LearningProgress)
    private readonly progressRepository: Repository<LearningProgress>,
  ) {}

  /**
   * 更新/创建课时学习进度
   *
   * @param userId - 用户ID（从 JWT 中获取）
   * @param dto - 更新进度 DTO
   * @returns 更新后的学习进度记录
   *
   * 逻辑说明：
   * - 使用 upsert（INSERT ON DUPLICATE KEY UPDATE）避免并发导致的唯一索引冲突
   * - 当 progress >= 95 时自动标记为 completed 并记录完成时间
   * - playCount 仅在首次创建时初始化为 1，后续更新不递增
   * - 仅当新的 lastPosition 更大时才更新（防止旧数据覆盖新数据）
   */
  async updateProgress(
    userId: number,
    dto: UpdateProgressDto,
  ): Promise<LearningProgress> {
    const { lessonId, courseId, lastPosition, duration, progress } = dto;

    // 查找现有记录
    let record = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });

    // 计算进度百分比（优先使用前端传入的进度，否则由后端计算）
    const calcProgress =
      progress ??
      (duration > 0
        ? Math.round((Math.min(lastPosition, duration) / duration) * 1000) / 10
        : 0);
    const finalProgress = Math.min(100, Math.max(0, calcProgress));
    const isCompleted = finalProgress >= 95;

    if (record) {
      // 更新已有记录 —— 仅当新的 lastPosition 更大时才更新（防止旧数据覆盖新数据）
      if (lastPosition > record.lastPosition) {
        record.lastPosition = lastPosition;
        record.progress = finalProgress;
        record.duration = duration;

        // 如果之前未完成但现在完成了，记录完成时间
        if (isCompleted && !record.completed) {
          record.completed = true;
          record.completedAt = new Date();
        }
      }
      return this.progressRepository.save(record);
    }

    // 创建新记录（使用 upsert 处理并发冲突）
    try {
      record = this.progressRepository.create({
        userId,
        courseId,
        lessonId,
        lastPosition,
        duration,
        progress: finalProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        playCount: 1,
      });
      return await this.progressRepository.save(record);
    } catch (err: any) {
      // 处理并发导致唯一索引冲突 —— 另一请求已创建了记录
      if (err?.code === 'ER_DUP_ENTRY') {
        // 查找已有的记录并更新
        const existing = await this.progressRepository.findOne({
          where: { userId, lessonId },
        });
        if (existing && lastPosition > existing.lastPosition) {
          existing.lastPosition = lastPosition;
          existing.progress = finalProgress;
          existing.duration = duration;
          if (isCompleted && !existing.completed) {
            existing.completed = true;
            existing.completedAt = new Date();
          }
          return this.progressRepository.save(existing);
        }
        return existing!;
      }
      // 其他错误直接抛出
      throw err;
    }
  }

  /**
   * 获取指定课时的学习进度
   *
   * @param userId - 用户ID
   * @param lessonId - 课时ID
   * @returns 学习进度记录，如果不存在则返回 null
   */
  async getLessonProgress(
    userId: number,
    lessonId: number,
  ): Promise<LearningProgress | null> {
    return this.progressRepository.findOne({
      where: { userId, lessonId },
    });
  }

  /**
   * 获取用户在某课程中的总学习进度统计
   *
   * @param userId - 用户ID
   * @param courseId - 课程ID
   * @returns 课程总进度统计
   *
   * 返回结构：
   * - totalLessons: 该课程总课时数（从 learning_progress 表中统计，非课程表数据）
   * - completedLessons: 已完成的课时数
   * - progress: 课程总进度百分比
   */
  async getCourseProgress(
    userId: number,
    courseId: number,
  ): Promise<{
    totalLessons: number;
    completedLessons: number;
    startedLessons: number;
    progress: number;
  }> {
    const records = await this.progressRepository.find({
      where: { userId, courseId },
    });

    const totalLessons = records.length;
    const completedLessons = records.filter((r) => r.completed).length;
    const startedLessons = records.filter((r) => r.progress > 0).length;

    // 计算平均进度
    const progress =
      totalLessons > 0
        ? Math.round(
            (records.reduce((sum, r) => sum + Number(r.progress), 0) /
              totalLessons) *
              10,
          ) / 10
        : 0;

    return { totalLessons, completedLessons, startedLessons, progress };
  }

  /**
   * 获取用户在某课程中所有课时的进度列表（用于前端侧边栏展示每个课时的完成状态）
   *
   * @param userId - 用户ID
   * @param courseId - 课程ID
   * @returns 课时进度列表，包含每个课时的完成状态和最后播放位置
   */
  async getCourseLessonProgresses(
    userId: number,
    courseId: number,
  ): Promise<LearningProgress[]> {
    return this.progressRepository.find({
      where: { userId, courseId },
      select: [
        'id',
        'lessonId',
        'progress',
        'lastPosition',
        'completed',
        'duration',
      ],
    });
  }
}
