import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

/**
 * 创建课时 DTO
 * 功能描述：创建课时时所需的请求参数
 * previewDuration 为课时级试看时长（秒），0 表示使用课程级默认设置
 */
export class CreateLessonDto {
  /** 所属章节ID，单课程时不传此字段 */
  @IsOptional()
  @IsNumber({}, { message: '章节ID必须是数字' })
  chapterId?: number;

  /** 课时标题 */
  @IsString({ message: '课时标题必须是字符串' })
  title: string;

  /** 课时描述 */
  @IsOptional()
  @IsString({ message: '课时描述必须是字符串' })
  description?: string;

  /** 视频时长（秒） */
  @IsOptional()
  @IsNumber({}, { message: '视频时长必须是数字' })
  duration?: number;

  /** 关联的视频ID */
  @IsOptional()
  @IsNumber({}, { message: '视频ID必须是数字' })
  videoId?: number;

  /** 是否免费试看（与 previewDuration 互斥） */
  @IsOptional()
  @IsBoolean({ message: '试看标记必须是布尔值' })
  isFree?: boolean;

  /** 课时级试看时长（秒），0 表示使用课程级默认，范围 0~600 */
  @IsOptional()
  @IsNumber({}, { message: '试看时长必须是数字' })
  @Min(0, { message: '试看时长不能小于0' })
  @Max(600, { message: '试看时长不能超过600秒' })
  previewDuration?: number;

  /**
   * 是否支持单独购买（仅对系列课内的课时生效）
   * 默认 false，表示不支持单独购买
   */
  @IsOptional()
  @IsBoolean({ message: '单独购买标记必须是布尔值' })
  canSinglePurchase?: boolean;

  /**
   * 单独购买价格（单位：元）
   * 仅当 canSinglePurchase = true 时生效
   * 支持单独购买时必填，须大于 0
   * 传入的是"元"，后端会转换为"分"存储
   */
  @IsOptional()
  @IsNumber({}, { message: '单独购买价格必须是数字' })
  @Min(0, { message: '单独购买价格不能小于0' })
  singlePrice?: number;

  /** 排序权重，数值越小越靠前 */
  @IsOptional()
  @IsNumber({}, { message: '排序权重必须是数字' })
  sortOrder?: number;
}
