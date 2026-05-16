import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';
import { Earning } from './entities/earning.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Course } from '../courses/entities/course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { TeachersModule } from '../teachers/teachers.module';
import { OrdersModule } from '../orders/orders.module';
import { CoursesModule } from '../courses/courses.module';

/**
 * 收益模块
 * 功能描述：处理教师收益记录、平台收益统计、收益流水查询
 *
 * 模块依赖：
 * - TeachersModule：获取教师信息（userId → teacherId 转换）
 * - OrdersModule：获取订单数据（支付成功/退款时触发收益）
 * - CoursesModule：获取课程归属教师信息
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Earning, Order, OrderItem, Course, Teacher]),
    forwardRef(() => TeachersModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => CoursesModule),
  ],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}
