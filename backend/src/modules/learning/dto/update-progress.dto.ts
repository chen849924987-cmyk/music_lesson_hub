/**
 * UpdateProgressDto 更新学习进度 DTO
 *
 * 功能描述：前端定时同步视频播放进度时使用的请求体
 *
 * @param lessonId - 课时ID（必填）
 * @param courseId - 课程ID（必填）
 * @param lastPosition - 视频当前播放位置（秒，必填）
 * @param duration - 视频总时长（秒，必填）
 * @param progress - 播放进度百分比（0~100，可选，由后端自动计算）
 */
import { IsInt, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProgressDto {
  @Type(() => Number)
  @IsInt()
  lessonId: number;

  @Type(() => Number)
  @IsInt()
  courseId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lastPosition: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  duration: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}
