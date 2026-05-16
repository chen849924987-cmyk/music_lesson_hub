import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../../../common/constants';
import { PAGINATION } from '../../../common/constants';

/**
 * 优惠券查询请求 DTO
 * 功能描述：用于分页查询优惠券列表的请求参数
 */
export class QueryCouponDto {
  /** 页码（默认第1页） */
  @IsOptional()
  @IsInt({ message: '页码必须为整数' })
  @Min(1, { message: '页码最小值为1' })
  @Type(() => Number)
  page?: number = PAGINATION.DEFAULT_PAGE;

  /** 每页条数（默认20条） */
  @IsOptional()
  @IsInt({ message: '每页条数必须为整数' })
  @Min(1, { message: '每页条数最小值为1' })
  @Type(() => Number)
  pageSize?: number = PAGINATION.DEFAULT_PAGE_SIZE;

  /** 优惠券名称（模糊搜索） */
  @IsOptional()
  @IsString({ message: '名称必须为字符串' })
  name?: string;

  /** 优惠券码（精准搜索） */
  @IsOptional()
  @IsString({ message: '优惠券码必须为字符串' })
  code?: string;

  /** 优惠券类型筛选 */
  @IsOptional()
  @IsEnum(CouponType, { message: '优惠券类型无效' })
  type?: CouponType;

  /** 是否启用筛选 */
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
