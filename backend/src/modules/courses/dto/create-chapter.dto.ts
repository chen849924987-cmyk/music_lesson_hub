import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * 创建章节 DTO
 * 功能描述：在系列课程下创建章节时所需的请求参数
 */
export class CreateChapterDto {
  /** 章节标题 */
  @IsString({ message: '章节标题必须是字符串' })
  title: string;

  /** 章节描述 */
  @IsOptional()
  @IsString({ message: '章节描述必须是字符串' })
  description?: string;

  /** 排序权重，数值越小越靠前 */
  @IsOptional()
  @IsNumber({}, { message: '排序权重必须是数字' })
  sortOrder?: number;
}
