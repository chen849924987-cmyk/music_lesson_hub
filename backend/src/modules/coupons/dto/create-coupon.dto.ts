import { IsString, IsEnum, IsInt, IsOptional, IsBoolean, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../../../common/constants';

/**
 * 创建优惠券请求 DTO
 * 功能描述：用于创建优惠券的请求参数校验
 */
export class CreateCouponDto {
  /** 优惠券名称 */
  @IsString({ message: '优惠券名称不能为空' })
  name: string;

  /** 优惠券码 */
  @IsString({ message: '优惠券码不能为空' })
  code: string;

  /** 优惠券类型：fixed-满减券 percentage-折扣券 */
  @IsEnum(CouponType, { message: '优惠券类型无效' })
  type: CouponType;

  /**
   * 优惠面值
   * - 满减券：减免金额，单位：分
   * - 折扣券：折扣百分比（1-99）
   */
  @IsInt({ message: '优惠面值必须为整数' })
  @Min(1, { message: '优惠面值不能小于1' })
  discount: number;

  /** 最低使用门槛（单位：分），0表示无门槛 */
  @IsOptional()
  @IsInt({ message: '使用门槛必须为整数' })
  @Min(0, { message: '使用门槛不能为负数' })
  @Type(() => Number)
  minAmount?: number;

  /** 折扣券最大减免金额（单位：分），仅折扣券有效 */
  @IsOptional()
  @IsInt({ message: '最大减免金额必须为整数' })
  @Min(1, { message: '最大减免金额不能小于1' })
  @Type(() => Number)
  maxDiscount?: number;

  /** 总发放数量（-1表示不限量） */
  @IsOptional()
  @IsInt({ message: '发放数量必须为整数' })
  @Type(() => Number)
  totalCount?: number;

  /** 每人限领数量 */
  @IsOptional()
  @IsInt({ message: '每人限领数量必须为整数' })
  @Min(0, { message: '每人限领数量不能为负数' })
  @Type(() => Number)
  perUserLimit?: number;

  /** 有效期开始时间 */
  @IsDateString({}, { message: '开始时间格式无效' })
  startTime: string;

  /** 有效期结束时间 */
  @IsDateString({}, { message: '结束时间格式无效' })
  endTime: string;

  /** 是否启用 */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须为布尔值' })
  @Type(() => Boolean)
  isActive?: boolean;

  /** 优惠券描述 */
  @IsOptional()
  @IsString({ message: '描述必须为字符串' })
  description?: string;
}
