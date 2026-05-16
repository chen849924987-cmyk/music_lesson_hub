import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CourseType, CourseStatus } from '../../../common/constants';
import { PaginationWithSortDto } from '../../../common/dto/pagination.dto';

/**
 * 课程查询 DTO
 * 功能描述：客户端查询课程列表时支持的筛选和排序参数
 */
export class CourseQueryDto extends PaginationWithSortDto {
  /** 分类ID筛选 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '分类ID必须是数字' })
  categoryId?: number;

  /** 课程类型筛选：single-单课程 series-系列课程 */
  @IsOptional()
  @IsEnum(CourseType, { message: '课程类型无效' })
  courseType?: CourseType;

  /** 课程状态筛选 */
  @IsOptional()
  @IsEnum(CourseStatus, { message: '课程状态无效' })
  status?: CourseStatus;

  /** 教师ID筛选 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '教师ID必须是数字' })
  teacherId?: number;

  /** 关键词搜索（标题） */
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  keyword?: string;
}
