import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 分页查询参数 DTO
 * 功能描述：用于所有需要分页查询的接口，统一分页参数格式
 */
export class PaginationDto {
  /** 当前页码，从1开始 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为1' })
  page?: number = 1;

  /** 每页条数 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页条数必须是整数' })
  @Min(1, { message: '每页条数最小为1' })
  @Max(100, { message: '每页条数最大为100' })
  pageSize?: number = 20;
}

/**
 * 分页查询排序参数 DTO
 * 功能描述：扩展分页参数，增加排序字段和排序方向
 */
export class PaginationWithSortDto extends PaginationDto {
  /** 排序字段 */
  @IsOptional()
  sortBy?: string = 'createdAt';

  /** 排序方向：ASC 升序 / DESC 降序 */
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * 分页响应元数据
 * 功能描述：统一分页响应的元数据格式
 */
export class PaginationMeta {
  /** 总记录数 */
  total: number;

  /** 当前页码 */
  page: number;

  /** 每页条数 */
  pageSize: number;

  /** 总页数 */
  totalPages: number;

  constructor(total: number, page: number, pageSize: number) {
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}
