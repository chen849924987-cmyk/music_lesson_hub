import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupon.dto';

/**
 * 更新优惠券请求 DTO
 * 功能描述：用于更新优惠券的请求参数，所有字段均为可选
 */
export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
