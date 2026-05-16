import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseReview } from '../courses/entities/course-review.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Order } from '../orders/entities/order.entity';

/**
 * 管理端统计模块
 * 功能描述：提供超管后台的统计数据接口，包括用户数、教师数、课程数、待审核数量等
 * v4.1 新增 CourseReview 实体注册，用于审核员工作量统计
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Teacher, Course, CourseReview, Attachment, Order]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
