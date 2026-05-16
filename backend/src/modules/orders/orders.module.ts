import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from './entities/cart.entity';
import { Course } from '../courses/entities/course.entity';
import { UserCourse } from '../courses/entities/user-course.entity';
import { UserLesson } from '../courses/entities/user-lesson.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { EarningsModule } from '../earnings/earnings.module';

/**
 * 订单模块
 * 功能描述：提供订单和购物车的完整功能，包括订单创建、取消、查询、支付回调处理以及购物车管理
 *
 * 依赖关系：
 * - EarningsModule（收益模块）：订单支付成功/退款时触发收益记录
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, CartItem, Course, UserCourse, UserLesson, Lesson]),
    forwardRef(() => EarningsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
