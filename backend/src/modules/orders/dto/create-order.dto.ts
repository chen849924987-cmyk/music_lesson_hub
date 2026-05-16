import { IsArray, IsInt, IsOptional, Min, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建订单请求 DTO
 * 功能描述：接收前端提交的订单创建请求，支持从购物车批量创建或直接购买单个课程
 * @param courseIds 课程ID数组（从购物车结算时传入多个，直接购买时传入一个）
 * @param lessonIds 课时ID数组（可选，单独购买系列课内的单课时时传入）
 *                   与 courseIds 互斥，使用 lessonIds 时课程ID由服务端自动推断
 */
export class CreateOrderDto {
  /** 课程ID列表（至少1个） */
  @IsOptional()
  @IsArray({ message: '课程ID列表格式错误' })
  @IsInt({ each: true, message: '课程ID必须为整数' })
  courseIds?: number[];

  /** 课时ID列表（可选，单独购买系列课内的课时时传入） */
  @IsOptional()
  @IsArray({ message: '课时ID列表格式错误' })
  @Type(() => Number)
  @IsInt({ each: true, message: '课时ID必须为整数' })
  lessonIds?: number[];
}

/**
 * 创建购物车项 DTO
 * 功能描述：添加课程到购物车
 */
export class AddToCartDto {
  /** 课程ID */
  @IsInt({ message: '课程ID必须为整数' })
  courseId: number;

  /** 数量（可选，默认1） */
  @IsOptional()
  @IsInt({ message: '数量必须为整数' })
  @Min(1, { message: '数量不能小于1' })
  quantity?: number;
}

/**
 * 订单查询 DTO
 * 功能描述：订单列表查询参数
 */
export class OrderQueryDto {
  /** 页码 */
  @IsOptional()
  @IsInt()
  page?: number;

  /** 每页条数 */
  @IsOptional()
  @IsInt()
  pageSize?: number;

  /** 状态筛选（可选） */
  @IsOptional()
  status?: string;
}
