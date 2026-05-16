import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';

/**
 * 优惠券模块
 * 功能描述：提供优惠券的完整功能，包括管理端的创建/编辑/删除/查询，
 *          以及用户端的领取/使用/计算折扣等接口
 */
@Module({
  imports: [TypeOrmModule.forFeature([Coupon, UserCoupon])],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
