/**
 * 管理端统计服务
 *
 * 功能描述：提供超管后台各项统计数据，包括用户数、教师数、课程数、待审核数量、
 *          订单统计和收益概览等。v4.1 新增订单和收益统计。
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseReview } from '../courses/entities/course-review.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../../common/constants';

/**
 * 管理端统计服务
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseReview)
    private readonly courseReviewRepository: Repository<CourseReview>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /**
   * 获取超管控制台统计数据
   *
   * @returns 包含用户总数、教师总数、课程总数、待审核数、订单数、收益概览等
   */
  async getStats(): Promise<{
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalCourses: number;
    pendingCourses: number;
    pendingAttachments: number;
    totalOrders: number;
    paidOrderCount: number;
    totalRevenue: number;
    totalEarnings: number;
  }> {
    const totalUsers = await this.userRepository.count();
    const totalTeachers = await this.teacherRepository.count();
    // 制作人（学生）数 = 总用户 - 管理员相关角色
    const totalStudents = await this.userRepository.count({
      where: { role: 'student' as any },
    });
    const totalCourses = await this.courseRepository.count({
      where: { status: 'approved' as any },
    });
    const pendingCourses = await this.courseRepository.count({
      where: { status: 'pending' as any },
    });
    const pendingAttachments = await this.attachmentRepository.count({
      where: { status: 'pending' as any },
    });

    // 订单统计
    const totalOrders = await this.orderRepository.count();
    const paidOrderCount = await this.orderRepository.count({
      where: { status: OrderStatus.PAID },
    });

    // 收益统计（从 orders 表汇总）
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.REFUNDED],
      })
      .getRawOne();
    const totalRevenue = Number(revenueResult?.total || 0);

    // 教师总收益（从 teacher 表汇总）
    const teacherResult = await this.teacherRepository
      .createQueryBuilder('teacher')
      .select('COALESCE(SUM(teacher.totalEarnings), 0)', 'total')
      .getRawOne();
    const totalEarnings = Number(teacherResult?.total || 0);

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalCourses,
      pendingCourses,
      pendingAttachments,
      totalOrders,
      paidOrderCount,
      totalRevenue,
      totalEarnings,
    };
  }

  /**
   * 获取审核员工作量统计
   *
   * @param currentUserId - 当前登录用户ID
   * @param isAdmin - 是否为超管（超管查看全部，审核员只看自己）
   * @returns 每位审核员的审核工作量汇总，包括总审核次数、通过数、驳回数、最近审核时间
   *
   * @description 超管查看所有审核员的统计，审核员只能查看自己的统计
   */
  async getReviewerWorkload(
    currentUserId?: number,
    isAdmin?: boolean,
  ): Promise<
    {
      reviewerId: number;
      username: string;
      totalReviews: number;
      approvedCount: number;
      rejectedCount: number;
      lastReviewAt: string | null;
    }[]
  > {
    const queryBuilder = this.courseReviewRepository
      .createQueryBuilder('cr')
      .leftJoin(User, 'u', 'cr.reviewerId = u.id')
      .select([
        'cr.reviewerId AS reviewerId',
        'u.username AS username',
        'COUNT(*) AS totalReviews',
        'SUM(CASE WHEN cr.action = \'approved\' THEN 1 ELSE 0 END) AS approvedCount',
        'SUM(CASE WHEN cr.action = \'rejected\' THEN 1 ELSE 0 END) AS rejectedCount',
        'MAX(cr.createdAt) AS lastReviewAt',
      ])
      .groupBy('cr.reviewerId')
      .addGroupBy('u.username')
      .orderBy('totalReviews', 'DESC');

    // 审核员只能看自己的工作量
    if (!isAdmin && currentUserId) {
      queryBuilder.andWhere('cr.reviewerId = :currentUserId', { currentUserId });
    }

    const result = await queryBuilder.getRawMany();

    return result.map((item: any) => ({
      reviewerId: Number(item.reviewerId),
      username: item.username || '未知用户',
      totalReviews: Number(item.totalReviews),
      approvedCount: Number(item.approvedCount),
      rejectedCount: Number(item.rejectedCount),
      lastReviewAt: item.lastReviewAt || null,
    }));
  }
}
