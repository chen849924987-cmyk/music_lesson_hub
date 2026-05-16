import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

/**
 * 创建分类 DTO
 * 功能描述：创建课程分类时所需的请求参数
 */
export class CreateCategoryDto {
  /** 分类名称，例如：吉他、钢琴、声乐 */
  @IsString({ message: '分类名称必须是字符串' })
  name: string;

  /** 分类图标URL */
  @IsOptional()
  @IsString({ message: '图标URL必须是字符串' })
  icon?: string;

  /** 排序权重，数值越小越靠前 */
  @IsOptional()
  @IsNumber({}, { message: '排序权重必须是数字' })
  sortOrder?: number;

  /** 是否启用 */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean;
}
