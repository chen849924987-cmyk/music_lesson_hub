import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from './entities/cart.entity';
import { CreateOrderDto, OrderQueryDto } from './dto/create-order.dto';
import { Course } from '../courses/entities/course.entity';
import { UserCourse } from '../courses/entities/user-course.entity';
import { UserLesson } from '../courses/entities/user-lesson.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { EarningsService } from '../earnings/earnings.service';
import { OrderStatus, OrderType, PAGINATION } from '../../common/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * 订单服务
 * 功能描述：处理订单与购物车相关的所有业务逻辑，包括订单创建、取消、查询以及购物车管理
 *
 * 订单号生成规则：ORD + 14位时间戳(YYYYMMDDHHmmss) + 6位随机数字
 * 订单过期规则：待支付订单创建30分钟后自动过期
 *
 * 支持两种购买模式：
 * 1. 购买完整课程（courseIds）- 支持单课程和系列课程
 * 2. 购买系列课内的单独课时（lessonIds）- 支持系列课中的单个课时单独购买
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(UserCourse)
    private readonly userCourseRepository: Repository<UserCourse>,
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @Inject(forwardRef(() => EarningsService))
    private readonly earningsService: EarningsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 生成唯一订单号
   * 功能描述：基于当前时间戳和随机数生成全局唯一的订单号
   * @returns 字符串格式的订单号，例如：ORD20260514123045123456
   */
  private generateOrderNo(): string {
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `ORD${timestamp}${random}`;
  }

  /**
   * 创建订单（入口方法）
   * 功能描述：根据传入参数类型自动路由到课程购买或课时购买
   *          - 传入 courseIds → 调用 createCourseOrder 购买完整课程
   *          - 传入 lessonIds → 调用 createLessonOrder 购买单独课时
   * @param userId 当前用户ID
   * @param createOrderDto 创建订单请求
   * @returns 创建的订单对象（含明细）
   * @throws BadRequestException 参数不合法
   */
  async createOrder(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const { courseIds, lessonIds } = createOrderDto;

    // 校验：必须提供 courseIds 或 lessonIds，不能同时为空
    if ((!courseIds || courseIds.length === 0) && (!lessonIds || lessonIds.length === 0)) {
      throw new BadRequestException('请提供要购买的课程（courseIds）或课时（lessonIds）');
    }

    // 如果提供了 lessonIds，走课时购买逻辑
    if (lessonIds && lessonIds.length > 0) {
      return this.createLessonOrder(userId, lessonIds);
    }

    // 否则走课程购买逻辑
    return this.createCourseOrder(userId, courseIds!);
  }

  /**
   * 创建课程订单（购买完整课程）
   * 功能描述：从购物车结算或直接购买创建订单，包含事务处理：
   *         1. 校验所有课程是否存在且已上架
   *         2. 校验用户是否已购买过这些课程
   *         3. 计算订单总金额
   *         4. 生成订单号和过期时间
   *         5. 创建订单及订单明细
   *         6. 清除购物车中已结算的课程
   * @param userId 当前用户ID
   * @param courseIds 课程ID数组
   * @returns 创建的订单对象（含明细）
   * @throws BadRequestException/ConflictException 各类校验失败
   */
  private async createCourseOrder(userId: number, courseIds: number[]): Promise<Order> {
    // 查询课程信息
    const courses = await this.courseRepository.find({
      where: { id: In(courseIds) },
    });

    // 校验：所有课程必须存在
    if (courses.length !== courseIds.length) {
      const foundIds = courses.map((c) => c.id);
      const missingIds = courseIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`课程不存在，缺失ID：${missingIds.join(', ')}`);
    }

    // 校验：所有课程必须已上架
    const offlineCourses = courses.filter((c) => c.status !== 'approved');
    if (offlineCourses.length > 0) {
      throw new BadRequestException(
        `以下课程未上架，无法购买：${offlineCourses.map((c) => c.title).join('、')}`,
      );
    }

    // 校验：用户不能重复购买已购买的课程
    const purchasedCourses = await this.userCourseRepository.find({
      where: { userId, courseId: In(courseIds) },
    });
    if (purchasedCourses.length > 0) {
      const purchasedIds = purchasedCourses.map((c) => c.courseId);
      const duplicateTitles = courses
        .filter((c) => purchasedIds.includes(c.id))
        .map((c) => c.title);
      throw new ConflictException(
        `您已购买以下课程，请勿重复购买：${duplicateTitles.join('、')}`,
      );
    }

    // 计算总金额（单位：分）
    const totalAmount = courses.reduce((sum, course) => sum + course.price, 0);

    // 如果总金额为 0（免费课程），直接返回错误（免费课程无需下单）
    if (totalAmount <= 0) {
      throw new BadRequestException('免费课程无需下单，请直接开始学习');
    }

    // 判断订单类型
    const orderType = courses.length === 1 ? OrderType.SINGLE_COURSE : OrderType.SERIES_COURSE;

    // 设置订单过期时间（30分钟）
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    // 使用事务创建订单
    const order = await this.dataSource.transaction(async (manager) => {
      // 创建订单
      const orderData = this.orderRepository.create({
        orderNo: this.generateOrderNo(),
        userId,
        totalAmount,
        status: OrderStatus.PENDING,
        orderType,
        expiredAt,
      });
      const savedOrder = await manager.save(Order, orderData);

      // 创建订单明细
      const orderItems = courses.map((course) =>
        this.orderItemRepository.create({
          orderId: savedOrder.id,
          courseId: course.id,
          courseTitle: course.title,
          price: course.price,
          quantity: 1,
        }),
      );
      await manager.save(OrderItem, orderItems);

      // 清除购物车中已结算的课程
      await manager.delete(CartItem, {
        userId,
        courseId: In(courseIds),
      });

      return savedOrder;
    });

    // 返回完整的订单信息（含明细）
    return this.findById(order.id);
  }

  /**
   * 创建课时单独购买订单
   * 功能描述：系列课内的单课时单独购买：
   *         1. 校验每个课时存在且属于已上架系列课
   *         2. 校验课时支持单独购买（canSinglePurchase = true）
   *         3. 校验用户未单独购买该课时且未购买完整课程
   *         4. 计算总金额
   *         5. 生成订单号
   *         6. 创建订单及明细
   * @param userId 当前用户ID
   * @param lessonIds 课时ID数组
   * @returns 创建的订单对象（含明细）
   * @throws BadRequestException/ConflictException 各类校验失败
   */
  private async createLessonOrder(userId: number, lessonIds: number[]): Promise<Order> {
    // 查询课时信息（包含关联的课程信息）
    const lessons = await this.lessonRepository.find({
      where: { id: In(lessonIds) },
      relations: ['chapter'],
    });

    // 校验：所有课时必须存在
    if (lessons.length !== lessonIds.length) {
      const foundIds = lessons.map((l) => l.id);
      const missingIds = lessonIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`课时不存在，缺失ID：${missingIds.join(', ')}`);
    }

    // 获取所有课时对应的课程ID
    const courseIds = lessons.map((l) => l.courseId);
    const uniqueCourseIds = [...new Set(courseIds)];

    // 校验：所有课时必须属于同一个课程（目前只支持同一课程下的课时一起结算）
    if (uniqueCourseIds.length > 1) {
      throw new BadRequestException('暂不支持不同课程的课时混合购买，请分别下单');
    }

    const courseId = uniqueCourseIds[0];

    // 查询所属课程，校验课程是否已上架
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new BadRequestException('课程不存在');
    }
    if (course.status !== 'approved') {
      throw new BadRequestException('该课程未上架，无法购买其中的课时');
    }
    if (course.courseType !== 'series') {
      throw new BadRequestException('只有系列课支持课时单独购买');
    }

    // 校验：每个课时必须支持单独购买
    const unsupportedLessons = lessons.filter((l) => !l.canSinglePurchase);
    if (unsupportedLessons.length > 0) {
      throw new BadRequestException(
        `以下课时不支持单独购买：${unsupportedLessons.map((l) => l.title).join('、')}`,
      );
    }

    // 校验：用户不能重复购买已单独购买的课时
    const purchasedLessons = await this.userLessonRepository.find({
      where: { userId, lessonId: In(lessonIds) },
    });
    if (purchasedLessons.length > 0) {
      const purchasedIds = purchasedLessons.map((l) => l.lessonId);
      const duplicateTitles = lessons
        .filter((l) => purchasedIds.includes(l.id))
        .map((l) => l.title);
      throw new ConflictException(
        `您已购买以下课时，请勿重复购买：${duplicateTitles.join('、')}`,
      );
    }

    // 校验：用户是否已购买整个课程（如果已购买整个课程，则无需单独购买课时）
    const hasFullCourse = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    if (hasFullCourse) {
      throw new ConflictException('您已购买该课程，无需单独购买课时');
    }

    // 计算总金额（单位为分）
    let totalAmount = 0;
    for (const lesson of lessons) {
      if (lesson.singlePrice <= 0) {
        throw new BadRequestException(`课时《${lesson.title}》的单独购买价格未设置`);
      }
      totalAmount += lesson.singlePrice;
    }

    // 设置订单过期时间（30分钟）
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    // 使用事务创建订单
    const order = await this.dataSource.transaction(async (manager) => {
      // 创建订单
      const orderData = this.orderRepository.create({
        orderNo: this.generateOrderNo(),
        userId,
        totalAmount,
        status: OrderStatus.PENDING,
        orderType: OrderType.SINGLE_LESSON,
        expiredAt,
      });
      const savedOrder = await manager.save(Order, orderData);

      // 创建订单明细（按课时维度）
      const orderItems = lessons.map((lesson) =>
        this.orderItemRepository.create({
          orderId: savedOrder.id,
          courseId: lesson.courseId,
          lessonId: lesson.id,
          courseTitle: course.title,
          lessonTitle: lesson.title,
          price: lesson.singlePrice,
          quantity: 1,
        }),
      );
      await manager.save(OrderItem, orderItems);

      return savedOrder;
    });

    // 返回完整的订单信息（含明细）
    return this.findById(order.id);
  }

  /**
   * 查询订单详情
   * @param orderId 订单ID
   * @returns 订单对象（含明细）
   * @throws NotFoundException 订单不存在
   */
  async findById(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  /**
   * 查询用户的订单列表
   * @param userId 用户ID
   * @param queryDto 查询参数（分页/状态筛选）
   * @returns 分页订单列表
   */
  async findUserOrders(userId: number, queryDto: OrderQueryDto) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      status,
    } = queryDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
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

  /**
   * 获取各状态订单数量统计
   * 功能描述：用于管理端订单管理页面的统计概览卡片
   * @returns 各状态订单数量
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    paid: number;
    refunded: number;
    refunding: number;
    cancelled: number;
  }> {
    const total = await this.orderRepository.count();
    const pending = await this.orderRepository.count({ where: { status: OrderStatus.PENDING } });
    const paid = await this.orderRepository.count({ where: { status: OrderStatus.PAID } });
    const refunded = await this.orderRepository.count({ where: { status: OrderStatus.REFUNDED } });
    const refunding = await this.orderRepository.count({ where: { status: OrderStatus.REFUNDING } });
    const cancelled = await this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } });
    return { total, pending, paid, refunded, refunding, cancelled };
  }

  /**
   * 管理端查询所有订单
   * @param queryDto 查询参数（分页/状态筛选/用户ID搜索）
   * @returns 分页订单列表（含用户信息和订单明细项）和统计信息
   */
  async findAllOrders(queryDto: OrderQueryDto & { userId?: number }) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      status,
      userId,
    } = queryDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }
    if (userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId });
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 同时获取各状态统计（前端用于展示统计概览卡片）
    const stats = await this.getOrderStats();

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      stats,
    };
  }

  /**
   * 通过订单号查询订单
   * @param orderNo 订单号
   * @returns 订单对象
   * @throws NotFoundException 订单不存在
   */
  async findByOrderNo(orderNo: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNo },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  /**
   * 取消订单
   * 功能描述：仅允许取消待支付状态的订单
   * @param orderId 订单ID
   * @param userId 当前用户ID（校验订单归属）
   * @throws ForbiddenException 非订单所有者不可操作
   * @throws BadRequestException 订单状态不允许取消
   */
  async cancelOrder(orderId: number, userId: number): Promise<Order> {
    const order = await this.findById(orderId);

    // 校验订单归属
    if (order.userId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }

    // 校验订单状态
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('仅待支付状态的订单可以取消');
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  /**
   * 支付成功后更新订单状态
   * 功能描述：将订单状态更新为已支付，同时创建 UserCourse 或 UserLesson 记录
   *          - 普通课程订单 → 创建 UserCourse（用户-课程关系）
   *          - 课时单独购买订单 → 创建 UserLesson（用户-课时关系）
   * @param orderId 订单ID
   * @param tradeNo 支付宝交易号
   * @throws BadRequestException 订单状态不合法（非待支付）
   */
  async paySuccess(orderId: number, tradeNo: string): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态异常，无法完成支付');
    }

    // 使用事务更新订单状态并创建用户课程/课时关系
    await this.dataSource.transaction(async (manager) => {
      // 更新订单状态
      await manager.update(Order, orderId, {
        status: OrderStatus.PAID,
        tradeNo,
        paidAt: new Date(),
      });

      const items = await this.orderItemRepository.find({
        where: { orderId },
      });

      if (order.orderType === OrderType.SINGLE_LESSON) {
        // 课时单独购买订单 → 创建 UserLesson 记录
        const userLessons = items.map((item) =>
          this.userLessonRepository.create({
            userId: order.userId,
            lessonId: item.lessonId!,
            courseId: item.courseId,
            orderId: order.id,
            price: item.price,
          }),
        );
        await manager.save(UserLesson, userLessons);
      } else {
        // 普通课程订单 → 创建 UserCourse 记录
        const userCourses = items.map((item) =>
          this.userCourseRepository.create({
            userId: order.userId,
            courseId: item.courseId,
            orderId: order.id,
            price: item.price,
          }),
        );
        await manager.save(UserCourse, userCourses);
      }
    });

    // === 支付成功后创建收益记录 ===
    try {
      await this.earningsService.createEarningsFromOrder(orderId);
    } catch (error) {
      this.logger.error(`创建收益记录失败（订单 ${orderId}）: ${(error as Error).message}`);
      // 不阻塞主流程，收益创建失败需要在管理后台手动处理
    }

    return this.findById(orderId);
  }

  /**
   * 退款处理（将订单恢复为未购买状态）
   * 功能描述：将订单标记为已退款，并删除对应的 UserCourse 或 UserLesson 记录
   * @param orderId 订单ID
   * @param remark 退款备注
   * @throws BadRequestException 订单状态不支持退款
   */
  async refundOrder(orderId: number, remark?: string): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('仅已支付的订单可以退款');
    }

    await this.dataSource.transaction(async (manager) => {
      // 更新订单状态
      await manager.update(Order, orderId, {
        status: OrderStatus.REFUNDED,
        remark: remark || '管理员退款',
      });

      const items = await this.orderItemRepository.find({
        where: { orderId },
      });

      if (order.orderType === OrderType.SINGLE_LESSON) {
        // 删除用户课时关系
        const lessonIds = items.map((item) => item.lessonId!);
        await manager.delete(UserLesson, {
          userId: order.userId,
          lessonId: In(lessonIds),
        });
      } else {
        // 删除用户课程关系
        const courseIds = items.map((item) => item.courseId);
        await manager.delete(UserCourse, {
          userId: order.userId,
          courseId: In(courseIds),
        });
      }
    });

    // === 退款后扣减收益 ===
    try {
      await this.earningsService.deductEarningsFromRefund(orderId);
    } catch (error) {
      this.logger.error(`扣减收益记录失败（订单 ${orderId}）: ${(error as Error).message}`);
      // 不阻塞主流程
    }

    return this.findById(orderId);
  }

  /**
   * 检查用户是否已购买课程
   * @param userId 用户ID
   * @param courseId 课程ID
   * @returns 是否已购买
   */
  async checkUserPurchased(userId: number, courseId: number): Promise<boolean> {
    const count = await this.userCourseRepository.count({
      where: { userId, courseId },
    });
    return count > 0;
  }

  // ================================================================
  // 购物车相关方法
  // ================================================================

  /**
   * 添加课程到购物车
   * @param userId 用户ID
   * @param courseId 课程ID
   * @param quantity 数量（默认1）
   * @throws BadRequestException 课程不存在或未上架
   * @throws ConflictException 课程已在购物车中
   */
  async addToCart(userId: number, courseId: number, quantity: number = 1): Promise<CartItem> {
    // 校验课程是否存在且已上架
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    if (course.status !== 'approved') {
      throw new BadRequestException('该课程暂未上架，无法加入购物车');
    }

    // 校验是否已在购物车中
    const existing = await this.cartRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      throw new ConflictException('该课程已在购物车中');
    }

    const cartItem = this.cartRepository.create({ userId, courseId, quantity });
    return this.cartRepository.save(cartItem);
  }

  /**
   * 从购物车移除课程
   * @param userId 用户ID
   * @param courseId 课程ID
   * @throws NotFoundException 购物车项不存在
   */
  async removeFromCart(userId: number, courseId: number): Promise<void> {
    const result = await this.cartRepository.delete({ userId, courseId });
    if (result.affected === 0) {
      throw new NotFoundException('购物车中未找到该课程');
    }
  }

  /**
   * 获取用户购物车列表
   * 功能描述：返回购物车中所有课程项并附带课程详细信息
   * @param userId 用户ID
   * @returns 购物车列表（含课程信息）
   */
  async getCart(userId: number): Promise<any[]> {
    const cartItems = await this.cartRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (cartItems.length === 0) {
      return [];
    }

    // 查询关联的课程信息
    const courseIds = cartItems.map((item) => item.courseId);
    const courses = await this.courseRepository.find({
      where: { id: In(courseIds) },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    return cartItems.map((item) => {
      const course = courseMap.get(item.courseId);
      return {
        id: item.id,
        courseId: item.courseId,
        quantity: item.quantity,
        createdAt: item.createdAt,
        course: course
          ? {
              id: course.id,
              title: course.title,
              cover: course.cover,
              price: course.price,
              courseType: course.courseType,
            }
          : null,
      };
    });
  }

  /**
   * 清空购物车（结算后调用）
   * @param userId 用户ID
   */
  async clearCart(userId: number): Promise<void> {
    await this.cartRepository.delete({ userId });
  }

  /**
   * 获取购物车数量
   * @param userId 用户ID
   * @returns 购物车中的课程数量
   */
  async getCartCount(userId: number): Promise<number> {
    return this.cartRepository.count({ where: { userId } });
  }
}
