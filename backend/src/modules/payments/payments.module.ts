import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AlipayConfig } from '../../config/alipay.config';
import { OrdersModule } from '../orders/orders.module';

/**
 * 支付模块
 * 功能描述：提供支付宝支付的完整功能，包括支付链接生成、异步通知处理、支付状态查询和手动确认
 *
 * 导入依赖：
 * - OrdersModule：用于获取订单信息并更新订单状态
 * - AlipayConfig：支付宝 SDK 配置提供者
 */
@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, AlipayConfig],
  exports: [PaymentsService],
})
export class PaymentsModule {}
