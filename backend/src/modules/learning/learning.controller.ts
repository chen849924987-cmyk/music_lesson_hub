/**
 * LearningController 学习进度控制器
 *
 * 功能描述：提供学习进度的 RESTful API，包括进度更新、断点续播查询和课程总进度统计。
 *
 * @API说明：
 * - POST /learning/progress - 更新课时学习进度（需登录）
 * - GET /learning/progress/:lessonId - 获取指定课时进度（需登录）
 * - GET /learning/course/:courseId - 获取课程总进度统计（需登录）
 * - GET /learning/course/:courseId/lessons - 获取课程所有课时进度列表（需登录）
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LearningService } from './learning.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('learning')
@UseGuards(AuthGuard('jwt'))
export class LearningController {
  private readonly logger = new Logger(LearningController.name);

  constructor(private readonly learningService: LearningService) {}

  /**
   * 更新课时学习进度
   *
   * @param userId - 当前登录用户ID（从 JWT 中自动提取）
   * @param dto - 学习进度数据
   * @returns 更新后的学习进度记录
   */
  @Post('progress')
  async updateProgress(
    @CurrentUser('sub') userId: number,
    @Body() dto: UpdateProgressDto,
  ) {
    const record = await this.learningService.updateProgress(userId, dto);
    return {
      id: record.id,
      lessonId: record.lessonId,
      progress: Number(record.progress),
      lastPosition: Number(record.lastPosition),
      completed: record.completed,
      completedAt: record.completedAt,
    };
  }

  /**
   * 获取指定课时的学习进度（用于断点续播）
   *
   * @param userId - 当前登录用户ID
   * @param lessonId - 课时ID（路由参数）
   * @returns 学习进度记录，包含 lastPosition（断点续播位置）
   */
  @Get('progress/:lessonId')
  async getLessonProgress(
    @CurrentUser('sub') userId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    const record = await this.learningService.getLessonProgress(
      userId,
      lessonId,
    );
    if (!record) {
      return {
        lessonId,
        progress: 0,
        lastPosition: 0,
        completed: false,
        completedAt: null,
      };
    }
    return {
      id: record.id,
      lessonId: record.lessonId,
      progress: Number(record.progress),
      lastPosition: Number(record.lastPosition),
      completed: record.completed,
      completedAt: record.completedAt,
    };
  }

  /**
   * 获取用户在课程中的总学习进度统计
   *
   * @param userId - 当前登录用户ID
   * @param courseId - 课程ID（路由参数）
   * @returns 课程总进度统计
   */
  @Get('course/:courseId')
  async getCourseProgress(
    @CurrentUser('sub') userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.learningService.getCourseProgress(userId, courseId);
  }

  /**
   * 获取课程中所有课时的进度列表
   *
   * @param userId - 当前登录用户ID
   * @param courseId - 课程ID（路由参数）
   * @returns 课时进度列表（含每个课时的完成状态和最后播放位置）
   */
  @Get('course/:courseId/lessons')
  async getCourseLessonProgresses(
    @CurrentUser('sub') userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const records = await this.learningService.getCourseLessonProgresses(
      userId,
      courseId,
    );
    return records.map((r) => ({
      lessonId: r.lessonId,
      progress: Number(r.progress),
      lastPosition: Number(r.lastPosition),
      completed: r.completed,
    }));
  }
}
