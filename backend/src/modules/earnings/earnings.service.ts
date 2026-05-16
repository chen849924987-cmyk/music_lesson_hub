import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Earning } from './entities/earning.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Course } from '../courses/entities/course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { OrderStatus, OrderType, EarningStatus, PAGINATION } from '../../common/constants';

  /**
   * 收益服务
   * 功能描述：处理教师收益的统计、记录与查询，以及超管平台收益概览
   *
   * 收益分配规则：
   * - 平台分成比例：30%（平台抽成，行业常见比例）
   * - 教师分成比例：70%（扣除平台分成后的实际到账）
   * - 所有金额以"分"为单位存储，防止浮点数精度问题
   *
   * 收益触发时机：
   * - 订单支付成功时自动创建收益记录
   * - 退款时自动创建负向收益记录（扣减）
   */
  @Injectable()
  export class EarningsService {
    private readonly logger = new Logger(EarningsService.name);

    /** 平台分成比例（百分比，默认 30%） */
    private readonly PLATFORM_SHARE_RATE = 0.3;

  constructor(
    @InjectRepository(Earning)
    private readonly earningRepository: Repository<Earning>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 订单支付成功后创建收益记录
   * 功能描述：根据已支付订单的明细，按课程归属教师创建收益记录。
   *          - 普通课程订单：按 OrderItem 中的 courseId 查找课程归属教师
   *          - 课时单独购买订单：按课时关联的课程查找教师
   *          同时更新教师的 totalEarnings 和 withdrawableBalance 字段
   *
   * @param orderId 已支付订单ID
   */
  async createEarningsFromOrder(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order || order.status !== OrderStatus.PAID) {
      this.logger.warn(`订单 ${orderId} 未支付或不存在，跳过收益创建`);
      return;
    }

    const items = order.items || await this.orderItemRepository.find({ where: { orderId } });
    if (items.length === 0) {
      this.logger.warn(`订单 ${orderId} 无明细项，跳过收益创建`);
      return;
    }

    // 获取所有课程ID并查询课程和归属教师
    const courseIds = [...new Set(items.map((item) => item.courseId))];
    const courses = await this.courseRepository.find({
      where: courseIds.map((id) => ({ id })),
      select: ['id', 'teacherId', 'title'],
    });
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // 按教师分组累计收益
    const earningsByTeacher = new Map<number, { teacherId: number; totalAmount: number; details: { courseId: number; courseTitle: string; price: number; orderItemId: number }[] }>();

    for (const item of items) {
      const course = courseMap.get(item.courseId);
      if (!course) {
        this.logger.warn(`课程 ${item.courseId} 不存在，跳过收益项`);
        continue;
      }
      if (!course.teacherId) {
        this.logger.warn(`课程 ${item.courseId} 无归属教师，跳过收益项`);
        continue;
      }

      const teacherId = course.teacherId;
      if (!earningsByTeacher.has(teacherId)) {
        earningsByTeacher.set(teacherId, { teacherId, totalAmount: 0, details: [] });
      }
      const entry = earningsByTeacher.get(teacherId)!;
      entry.totalAmount += item.price;
      entry.details.push({
        courseId: item.courseId,
        courseTitle: course.title,
        price: item.price,
        orderItemId: item.id,
      });
    }

    if (earningsByTeacher.size === 0) {
      this.logger.warn(`订单 ${orderId} 无有效收益项，跳过`);
      return;
    }

    // 使用事务创建收益记录并更新教师余额
    await this.dataSource.transaction(async (manager) => {
      for (const [, entry] of earningsByTeacher) {
        const platformShare = Math.round(entry.totalAmount * this.PLATFORM_SHARE_RATE);
        const actualAmount = entry.totalAmount - platformShare;

        // 创建收益记录（合并该教师在本订单中的所有收益为一条记录）
        const earning = this.earningRepository.create({
          teacherId: entry.teacherId,
          orderId: order.id,
          courseId: entry.details[0].courseId,
          courseTitle: entry.details.length === 1
            ? entry.details[0].courseTitle
            : `${entry.details[0].courseTitle} 等 ${entry.details.length} 门课程`,
          amount: entry.totalAmount,
          platformShare,
          actualAmount,
          type: 'course_sale',
          status: EarningStatus.SETTLED,
          remark: `订单 ${order.orderNo} 支付完成`,
        });
        await manager.save(Earning, earning);

        // 更新教师收益余额
        await manager
          .createQueryBuilder()
          .update(Teacher)
          .set({
            totalEarnings: () => `totalEarnings + ${entry.totalAmount}`,
            withdrawableBalance: () => `withdrawableBalance + ${actualAmount}`,
          })
          .where('id = :teacherId', { teacherId: entry.teacherId })
          .execute();
      }
    });

    this.logger.log(`订单 ${order.orderNo} 收益记录创建完成，共 ${earningsByTeacher.size} 位教师`);
  }

  /**
   * 退款时扣减收益记录
   * 功能描述：订单退款后，创建负向收益记录并扣减教师余额
   *
   * @param orderId 已退款订单ID
   */
  async deductEarningsFromRefund(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order || order.status !== OrderStatus.REFUNDED) {
      this.logger.warn(`订单 ${orderId} 未退款或不存在，跳过收益扣减`);
      return;
    }

    // 查找该订单原有的收益记录
    const earnings = await this.earningRepository.find({ where: { orderId } });
    if (earnings.length === 0) {
      this.logger.warn(`订单 ${orderId} 无原有收益记录，跳过扣减`);
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      for (const earning of earnings) {
        // 创建扣减记录（负向收益）
        const deductRecord = this.earningRepository.create({
          teacherId: earning.teacherId,
          orderId: order.id,
          courseId: earning.courseId,
          courseTitle: earning.courseTitle,
          amount: -earning.amount,
          platformShare: -earning.platformShare,
          actualAmount: -earning.actualAmount,
          type: 'refund',
          status: EarningStatus.SETTLED,
          remark: `订单 ${order.orderNo} 退款，扣减收益`,
        });
        await manager.save(Earning, deductRecord);

        // 扣减教师余额（原路扣回）
        await manager
          .createQueryBuilder()
          .update(Teacher)
          .set({
            totalEarnings: () => `totalEarnings - ${earning.amount}`,
            withdrawableBalance: () => `withdrawableBalance - ${earning.actualAmount}`,
          })
          .where('id = :teacherId', { teacherId: earning.teacherId })
          .execute();
      }
    });

    this.logger.log(`订单 ${order.orderNo} 收益扣减完成，共 ${earnings.length} 条记录`);
  }

  /**
   * 获取教师收益统计
   * 功能描述：返回当前教师的收益概览，包括总收入、可提现余额、待结算金额、已提现金额
   *
   * @param teacherId 教师ID
   * @returns 收益统计数据
   */
  async getTeacherEarningStats(teacherId: number): Promise<{
    totalEarnings: number;
    balance: number;
    pendingSettlement: number;
    totalWithdrawn: number;
  }> {
    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('教师信息不存在');
    }

    return {
      totalEarnings: Number(teacher.totalEarnings),
      balance: Number(teacher.withdrawableBalance),
      pendingSettlement: 0, // 当前所有收益均为实时结算，后续可扩展提现审核流程时改为 pending
      totalWithdrawn: Number(teacher.withdrawnAmount),
    };
  }

  /**
   * 获取教师收益明细（分页）
   * 功能描述：返回教师的所有收益流水记录，支持按时间范围筛选
   *
   * @param teacherId 教师ID
   * @param params 分页和筛选参数
   * @returns 收益明细列表（含分页）
   */
  async getTeacherEarningDetail(
    teacherId: number,
    params: {
      page?: number;
      pageSize?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { page = PAGINATION.DEFAULT_PAGE, pageSize = PAGINATION.DEFAULT_PAGE_SIZE, startDate, endDate } = params;

    const queryBuilder = this.earningRepository
      .createQueryBuilder('earning')
      .where('earning.teacherId = :teacherId', { teacherId })
      .orderBy('earning.createdAt', 'DESC');

    if (startDate) {
      queryBuilder.andWhere('earning.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      queryBuilder.andWhere('earning.createdAt <= :endDate', { endDate: new Date(endDate + 'T23:59:59') });
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // ================================================================
  // 超管平台收益统计
  // ================================================================

  /**
   * 获取平台收益总览（超管用）
   * 功能描述：返回平台整体收益数据，包括总流水、平台分成收入、教师总收益等
   *
   * @returns 平台收益统计
   */
  async getPlatformEarningStats(): Promise<{
    totalRevenue: number;        // 总流水（所有订单已支付金额，单位：分）
    platformIncome: number;      // 平台分成总收入（单位：分）
    teacherEarnings: number;     // 教师总收益（单位：分）
    totalWithdrawn: number;      // 教师已提现总额（单位：分）
    orderCount: number;          // 已支付订单总数
  }> {
    // 总流水：所有已支付订单的总金额
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.status IN (:...statuses)', { statuses: [OrderStatus.PAID, OrderStatus.REFUNDED] })
      .getRawOne();
    const totalRevenue = Number(revenueResult?.total || 0);

    // 已支付订单数
    const orderCount = await this.orderRepository.count({
      where: { status: OrderStatus.PAID },
    });

    // 平台分成总收入
    const platformResult = await this.earningRepository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.platformShare), 0)', 'total')
      .where('earning.type = :type', { type: 'course_sale' })
      .getRawOne();
    const platformIncome = Number(platformResult?.total || 0);

    // 教师总收益（所有 course_sale 类型的 actualAmount 总和，即扣除平台分成后的实际到账）
    const teacherResult = await this.earningRepository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.actualAmount), 0)', 'total')
      .where('earning.type = :type', { type: 'course_sale' })
      .getRawOne();
    const teacherEarnings = Number(teacherResult?.total || 0);

    // 教师已提现总额
    const withdrawalResult = await this.teacherRepository
      .createQueryBuilder('teacher')
      .select('COALESCE(SUM(teacher.withdrawnAmount), 0)', 'total')
      .getRawOne();
    const totalWithdrawn = Number(withdrawalResult?.total || 0);

    return {
      totalRevenue,
      platformIncome,
      teacherEarnings,
      totalWithdrawn,
      orderCount,
    };
  }

  /**
   * 获取平台收益趋势数据（按天统计最近N天）
   * 功能描述：用于管理端收益趋势图表展示
   *
   * @param days 最近N天，默认30天
   * @returns 每日收益数据
   */
  async getPlatformEarningTrend(days: number = 30): Promise<{
    date: string;
    revenue: number;       // 当日流水
    platformIncome: number; // 当日平台分成
    teacherEarnings: number; // 当日教师收益
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const earnings = await this.earningRepository
      .createQueryBuilder('earning')
      .select([
        'DATE(earning.createdAt) as date',
        'COALESCE(SUM(CASE WHEN earning.type = \'course_sale\' THEN earning.amount ELSE 0 END), 0) as revenue',
        'COALESCE(SUM(CASE WHEN earning.type = \'course_sale\' THEN earning.platformShare ELSE 0 END), 0) as platformIncome',
        'COALESCE(SUM(CASE WHEN earning.type = \'course_sale\' THEN earning.actualAmount ELSE 0 END), 0) as teacherEarnings',
      ])
      .where('earning.createdAt >= :startDate', { startDate })
      .andWhere('earning.type = :type', { type: 'course_sale' })
      .groupBy('DATE(earning.createdAt)')
      .orderBy('DATE(earning.createdAt)', 'ASC')
      .getRawMany();

    // TypeORM getRawMany() 返回的 key 格式为 "表名_字段别名"（如 earning_date、earning_revenue）
    // 同时兼容可能不带前缀的格式
    return earnings.map((e: any) => ({
      date: e.date || e.earning_date || '',
      revenue: Number(e.revenue ?? e.earning_revenue ?? 0),
      platformIncome: Number(e.platformIncome ?? e.earning_platformIncome ?? 0),
      teacherEarnings: Number(e.teacherEarnings ?? e.earning_teacherEarnings ?? 0),
    }));
  }

  /**
   * 获取课程收益排行榜（超管用）
   * 功能描述：按课程维度统计收益，返回收益最高的课程列表
   *
   * @param limit 返回条数，默认10
   * @returns 课程收益排行榜
   */
  async getTopEarningCourses(limit: number = 10): Promise<{
    courseId: number;
    courseTitle: string;
    totalAmount: number;
    orderCount: number;
  }[]> {
    const results = await this.earningRepository
      .createQueryBuilder('earning')
      .select([
        'earning.courseId as courseId',
        'earning.courseTitle as courseTitle',
        'COALESCE(SUM(earning.amount), 0) as totalAmount',
        'COUNT(DISTINCT earning.orderId) as orderCount',
      ])
      .where('earning.type = :type', { type: 'course_sale' })
      .groupBy('earning.courseId')
      .addGroupBy('earning.courseTitle')
      .orderBy('totalAmount', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r: any) => ({
      courseId: r.courseId,
      courseTitle: r.courseTitle,
      totalAmount: Number(r.totalAmount) || 0,
      orderCount: Number(r.orderCount) || 0,
    }));
  }

  /**
   * 获取教师收益排行榜（超管用）
   * 功能描述：按教师维度统计收益，返回收益最高的教师列表
   *
   * @param limit 返回条数，默认10
   * @returns 教师收益排行榜
   */
  async getTopEarningTeachers(limit: number = 10): Promise<{
    teacherId: number;
    realName: string;
    totalAmount: number;
  }[]> {
    const results = await this.earningRepository
      .createQueryBuilder('earning')
      .select([
        'earning.teacherId as teacherId',
        'COALESCE(SUM(earning.amount), 0) as totalAmount',
      ])
      .where('earning.type = :type', { type: 'course_sale' })
      .groupBy('earning.teacherId')
      .orderBy('totalAmount', 'DESC')
      .limit(limit)
      .getRawMany();

    if (results.length === 0) return [];

    // 补充教师姓名
    const teacherIds = results.map((r: any) => r.teacherId);
    const teachers = await this.teacherRepository.find({
      where: teacherIds.map((id) => ({ id })),
      select: ['id', 'realName'],
    });
    const teacherMap = new Map(teachers.map((t) => [t.id, t.realName]));

    return results.map((r: any) => ({
      teacherId: r.teacherId,
      realName: teacherMap.get(r.teacherId) || '未知教师',
      totalAmount: Number(r.totalAmount) || 0,
    }));
  }
}
