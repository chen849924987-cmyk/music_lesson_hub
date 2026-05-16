import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { CourseType } from '../../../common/constants';

/**
 * 创建课程 DTO
 * 功能描述：教师创建课程时所需的请求参数
 */
export class CreateCourseDto {
  /** 课程标题 */
  @IsString({ message: '课程标题必须是字符串' })
  @MaxLength(200, { message: '课程标题不能超过200个字符' })
  title: string;

  /** 课程封面图URL */
  @IsOptional()
  @IsString({ message: '封面图URL必须是字符串' })
  cover?: string;

  /** 课程简介 */
  @IsOptional()
  @IsString({ message: '课程简介必须是字符串' })
  description?: string;

  /** 课程分类ID */
  @IsNumber({}, { message: '分类ID必须是数字' })
  categoryId: number;

  /** 课程类型：single-单课程 series-系列课程 */
  @IsOptional()
  @IsEnum(CourseType, { message: '课程类型无效' })
  courseType?: CourseType;

  /** 课程定价（单位：分） */
  @IsOptional()
  @IsNumber({}, { message: '定价必须是数字' })
  @Min(0, { message: '定价不能小于0' })
  price?: number;

  /** 课程原价/划线价（单位：分） */
  @IsOptional()
  @IsNumber({}, { message: '原价必须是数字' })
  @Min(0, { message: '原价不能小于0' })
  originalPrice?: number;

  /** 试看时长（秒），0 表示不可试看，范围 1~600 */
  @IsOptional()
  @IsNumber({}, { message: '试看时长必须是数字' })
  @Min(0, { message: '试看时长不能小于0' })
  @Max(600, { message: '试看时长不能超过600秒' })
  previewDuration?: number;

  /** 预告视频ID（引用 videos 表） */
  @IsOptional()
  @IsNumber({}, { message: '预告视频ID必须是数字' })
  trailerVideoId?: number;

  /** 课程标签，逗号分隔 */
  @IsOptional()
  @IsString({ message: '标签必须是字符串' })
  tags?: string;
}
