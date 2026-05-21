import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Earning } from './entities/earning.entity';
import { Withdrawal } from './entities/withdrawal.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Course } from '../courses/entities/course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { OrderStatus, OrderType, EarningStatus, PAGINATION } from '../../common/constants';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { BusinessException } from '../../common/dto/response.dto';

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
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
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

  // ================================================================
  // 收益记录
  // ================================================================

  /**
   * 订单支付成功后创建收益记录
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

    const courseIds = [...new Set(items.map((item) => item.courseId))];
    const courses = await this.courseRepository.find({
      where: courseIds.map((id) => ({ id })),
      select: ['id', 'teacherId', 'title'],
    });
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    const earningsByTeacher = new Map<number, { teacherId: number; totalAmount: number; details: { courseId: number; courseTitle: string; price: number; orderItemId: number }[] }>();

    for (const item of items) {
      const course = courseMap.get(item.courseId);
      if (!course) continue;
      if (!course.teacherId) continue;

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

    if (earningsByTeacher.size === 0) return;

    await this.dataSource.transaction(async (manager) => {
      for (const [, entry] of earningsByTeacher) {
        const platformShare = Math.round(entry.totalAmount * this.PLATFORM_SHARE_RATE);
        const actualAmount = entry.totalAmount - platformShare;

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
   */
  async deductEarningsFromRefund(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order || order.status !== OrderStatus.REFUNDED) return;

    const earnings = await this.earningRepository.find({ where: { orderId } });
    if (earnings.length === 0) return;

    await this.dataSource.transaction(async (manager) => {
      for (const earning of earnings) {
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
  }

  // ================================================================
  // 提现管理
  // ================================================================

  /**
   * 教师申请提现
   * 功能描述：校验教师余额充足后创建提现申请记录。
   *          收款账号从教师个人设置（paymentAccount）中自动读取，
   *          教师只需输入提现金额。
   *
   * @param teacherId 教师ID
   * @param dto 提现参数（金额：元）
   * @returns 创建的提现申请
   *
   * @throws BusinessException.badRequest 未设置收款账号或余额不足
   */
  async applyWithdrawal(teacherId: number, dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('教师信息不存在');
    }

    // 金额转换：元 → 分
    const amountInCents = Math.round(dto.amount * 100);

    // 校验余额
    if (Number(teacher.withdrawableBalance) < amountInCents) {
      throw BusinessException.badRequest('可提现余额不足');
    }

    // 校验最低提现金额（1元 = 100分）
    if (amountInCents < 100) {
      throw BusinessException.badRequest('最低提现金额为 1 元');
    }

    // 从教师个人设置中自动读取收款账号
    const accountInfo = teacher.paymentAccount || '';
    if (!accountInfo) {
      throw BusinessException.badRequest('请先在个人中心设置收款账号');
    }

    // 创建提现申请
    const withdrawal = this.withdrawalRepository.create({
      teacherId,
      amount: amountInCents,
      accountInfo,
      status: 'pending',
    });

    const saved = await this.withdrawalRepository.save(withdrawal);

    // 冻结余额：从 withdrawableBalance 中扣减申请金额
    await this.teacherRepository
      .createQueryBuilder()
      .update(Teacher)
      .set({
        withdrawableBalance: () => `withdrawableBalance - ${amountInCents}`,
      })
      .where('id = :teacherId', { teacherId })
      .execute();

    // 创建提现类型的收益记录（负向）
    const earningRecord = this.earningRepository.create({
      teacherId,
      orderId: null as any,
      courseId: null as any,
      courseTitle: '提现申请',
      amount: -amountInCents,
      platformShare: 0,
      actualAmount: -amountInCents,
      type: 'withdrawal',
      status: EarningStatus.SETTLED,
      remark: `提现申请 #${saved.id}：¥${dto.amount} 至 ${accountInfo}`,
    });
    await this.earningRepository.save(earningRecord);

    this.logger.log(`教师 ${teacherId} 提交提现申请 #${saved.id}：${dto.amount} 元`);
    return saved;
  }

  /**
   * 管理端审核提现
   * 功能描述：审核提现申请，通过则标记为到账，驳回则恢复余额
   *
   * @param withdrawalId 提现申请ID
   * @param reviewerId 审核人用户ID
   * @param action 审核动作：approved-通过 rejected-驳回
   * @param remark 审核意见（驳回时必填）
   * @returns 更新后的提现申请
   */
  async reviewWithdrawal(
    withdrawalId: number,
    reviewerId: number,
    action: 'approved' | 'rejected',
    remark?: string,
  ): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
    });
    if (!withdrawal) {
      throw new NotFoundException('提现申请不存在');
    }

    if (withdrawal.status !== 'pending') {
      throw BusinessException.badRequest('该提现申请已处理，不能重复审核');
    }

    if (action === 'rejected' && !remark) {
      throw BusinessException.badRequest('驳回时必须填写原因');
    }

    const finalRemark = remark || '审核通过，已打款';

    // 使用事务保证原子性
    await this.dataSource.transaction(async (manager) => {
      if (action === 'approved') {
        // 审核通过：标记已到账
        withdrawal.status = 'approved';
        withdrawal.reviewerId = reviewerId;
        withdrawal.remark = finalRemark;
        withdrawal.processedAt = new Date();

        // 更新教师的已提现金额
        await manager
          .createQueryBuilder()
          .update(Teacher)
          .set({
            withdrawnAmount: () => `withdrawnAmount + ${withdrawal.amount}`,
          })
          .where('id = :teacherId', { teacherId: withdrawal.teacherId })
          .execute();

        // 创建已提现收益记录
        const earningRecord = this.earningRepository.create({
          teacherId: withdrawal.teacherId,
          orderId: null as any,
          courseId: null as any,
          courseTitle: '提现到账',
          amount: -withdrawal.amount,
          platformShare: 0,
          actualAmount: -withdrawal.amount,
          type: 'withdrawal',
          status: EarningStatus.SETTLED,
          remark: `提现申请 #${withdrawal.id} 审核通过，已打款`,
        });
        await manager.save(Earning, earningRecord);

      } else {
        // 审核驳回：恢复余额
        withdrawal.status = 'rejected';
        withdrawal.reviewerId = reviewerId;
        withdrawal.remark = remark as string;
        withdrawal.processedAt = new Date();

        // 恢复冻结的可提现余额
        await manager
          .createQueryBuilder()
          .update(Teacher)
          .set({
            withdrawableBalance: () => `withdrawableBalance + ${withdrawal.amount}`,
          })
          .where('id = :teacherId', { teacherId: withdrawal.teacherId })
          .execute();
      }

      await manager.save(Withdrawal, withdrawal);
    });

    this.logger.log(
      `提现申请 #${withdrawalId} ${action === 'approved' ? '审核通过' : '已驳回'}`,
    );
    return withdrawal;
  }

  /**
   * 获取教师的提现记录列表
   * @param teacherId 教师ID
   * @param page 页码
   * @param pageSize 每页条数
   */
  async getTeacherWithdrawals(
    teacherId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: Withdrawal[]; meta: any }> {
    const [items, total] = await this.withdrawalRepository.findAndCount({
      where: { teacherId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

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

  /**
   * 获取所有提现记录（管理端）
   * @param page 页码
   * @param pageSize 每页条数
   * @param status 状态筛选（可选）
   */
  async getAllWithdrawals(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
  ): Promise<{ items: Withdrawal[]; meta: any }> {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.withdrawalRepository.findAndCount({
      where,
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

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

  /**
   * 获取待审核提现数量（管理端控制台用）
   */
  async countPendingWithdrawals(): Promise<number> {
    return this.withdrawalRepository.count({
      where: { status: 'pending' },
    });
  }

  // ================================================================
  // 教师收益统计
  // ================================================================

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
      pendingSettlement: 0,
      totalWithdrawn: Number(teacher.withdrawnAmount),
    };
  }

  async getTeacherEarningDetail(
    teacherId: number,
    params: { page?: number; pageSize?: number; startDate?: string; endDate?: string },
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
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ================================================================
  // 超管平台收益统计
  // ================================================================

  async getPlatformEarningStats(): Promise<{
    totalRevenue: number; platformIncome: number; teacherEarnings: number;
    totalWithdrawn: number; orderCount: number;
  }> {
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.status IN (:...statuses)', { statuses: [OrderStatus.PAID, OrderStatus.REFUNDED] })
      .getRawOne();
    const totalRevenue = Number(revenueResult?.total || 0);

    const orderCount = await this.orderRepository.count({ where: { status: OrderStatus.PAID } });

    const platformResult = await this.earningRepository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.platformShare), 0)', 'total')
      .where('earning.type = :type', { type: 'course_sale' })
      .getRawOne();
    const platformIncome = Number(platformResult?.total || 0);

    const teacherResult = await this.earningRepository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.actualAmount), 0)', 'total')
      .where('earning.type = :type', { type: 'course_sale' })
      .getRawOne();
    const teacherEarnings = Number(teacherResult?.total || 0);

    const withdrawalResult = await this.teacherRepository
      .createQueryBuilder('teacher')
      .select('COALESCE(SUM(teacher.withdrawnAmount), 0)', 'total')
      .getRawOne();
    const totalWithdrawn = Number(withdrawalResult?.total || 0);

    return { totalRevenue, platformIncome, teacherEarnings, totalWithdrawn, orderCount };
  }

  async getPlatformEarningTrend(days: number = 30): Promise<{
    date: string; revenue: number; platformIncome: number; teacherEarnings: number;
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

    return earnings.map((e: any) => ({
      date: e.date || e.earning_date || '',
      revenue: Number(e.revenue ?? e.earning_revenue ?? 0),
      platformIncome: Number(e.platformIncome ?? e.earning_platformIncome ?? 0),
      teacherEarnings: Number(e.teacherEarnings ?? e.earning_teacherEarnings ?? 0),
    }));
  }

  async getTopEarningCourses(limit: number = 10): Promise<{
    courseId: number; courseTitle: string; totalAmount: number; orderCount: number;
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

  async getTopEarningTeachers(limit: number = 10): Promise<{
    teacherId: number; realName: string; totalAmount: number;
  }[]> {
    const results = await this.earningRepository
      .createQueryBuilder('earning')
      .select(['earning.teacherId as teacherId', 'COALESCE(SUM(earning.amount), 0) as totalAmount'])
      .where('earning.type = :type', { type: 'course_sale' })
      .groupBy('earning.teacherId')
      .orderBy('totalAmount', 'DESC')
      .limit(limit)
      .getRawMany();

    if (results.length === 0) return [];

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
