import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan, MoreThan, Brackets, DataSource } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { CouponType, PAGINATION } from '../../common/constants';

/**
 * 优惠券服务
 * 功能描述：处理优惠券的创建、发放、使用、查询等业务逻辑
 *
 * 优惠券类型：
 * - fixed（满减券）：按固定金额减免，需满足最低使用门槛
 * - percentage（折扣券）：按百分比折扣，可设置最大减免金额上限
 */
@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(UserCoupon)
    private readonly userCouponRepository: Repository<UserCoupon>,
    private readonly dataSource: DataSource,
  ) {}

  // ================================================================
  // 优惠券管理（管理端）
  // ================================================================

  /**
   * 创建优惠券
   * 功能描述：创建新的优惠券定义，校验优惠券码唯一性
   * @param createCouponDto 创建优惠券请求参数
   * @returns 创建的优惠券对象
   * @throws ConflictException 优惠券码已存在
   * @throws BadRequestException 参数校验失败
   */
  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const { code, type, discount, totalCount, startTime, endTime } = createCouponDto;

    // 校验：优惠券码唯一性
    const existing = await this.couponRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`优惠券码"${code}"已存在`);
    }

    // 校验：满减券 discount 必须大于等于 1
    if (type === CouponType.FIXED && discount < 1) {
      throw new BadRequestException('满减券的减免金额不能小于1分');
    }

    // 校验：折扣券 discount 必须在 1-99 之间
    if (type === CouponType.PERCENTAGE && (discount < 1 || discount > 99)) {
      throw new BadRequestException('折扣券的折扣百分比必须在1-99之间');
    }

    // 校验：开始时间不能晚于结束时间
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (startDate >= endDate) {
      throw new BadRequestException('有效期开始时间不能晚于或等于结束时间');
    }

    // 校验：折扣券设置了 maxDiscount 时，不能小于1
    if (type === CouponType.FIXED && createCouponDto.maxDiscount) {
      throw new BadRequestException('满减券不支持设置最大减免金额');
    }

    // 计算剩余数量
    const remainingCount = totalCount !== undefined ? totalCount : -1;

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      startTime: startDate,
      endTime: endDate,
      remainingCount,
      totalCount: totalCount !== undefined ? totalCount : -1,
      perUserLimit: createCouponDto.perUserLimit ?? 1,
      minAmount: createCouponDto.minAmount ?? 0,
      isActive: createCouponDto.isActive ?? true,
    });

    return this.couponRepository.save(coupon);
  }

  /**
   * 分页查询优惠券列表
   * 功能描述：支持按名称模糊搜索、按券码精准搜索、按类型和启用状态筛选
   * @param queryDto 查询参数
   * @returns 分页优惠券列表
   */
  async findAll(queryDto: QueryCouponDto) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      name,
      code,
      type,
      isActive,
    } = queryDto;

    const queryBuilder = this.couponRepository
      .createQueryBuilder('coupon')
      .orderBy('coupon.createdAt', 'DESC');

    // 按名称模糊搜索
    if (name) {
      queryBuilder.andWhere('coupon.name LIKE :name', { name: `%${name}%` });
    }

    // 按券码精准搜索
    if (code) {
      queryBuilder.andWhere('coupon.code = :code', { code });
    }

    // 按类型筛选
    if (type) {
      queryBuilder.andWhere('coupon.type = :type', { type });
    }

    // 按启用状态筛选
    if (isActive !== undefined) {
      queryBuilder.andWhere('coupon.isActive = :isActive', { isActive });
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
   * 查询单个优惠券详情
   * @param id 优惠券ID
   * @returns 优惠券对象
   * @throws NotFoundException 优惠券不存在
   */
  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }
    return coupon;
  }

  /**
   * 更新优惠券信息
   * 功能描述：更新优惠券的基本信息，code 不可修改
   * @param id 优惠券ID
   * @param updateCouponDto 更新参数
   * @returns 更新后的优惠券对象
   * @throws NotFoundException 优惠券不存在
   */
  async update(id: number, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    // 不允许更新 code
    if (updateCouponDto.code) {
      delete updateCouponDto.code;
    }

    // 如果更新了 type 或 discount，进行校验
    const type = updateCouponDto.type || coupon.type;
    const discount = updateCouponDto.discount ?? coupon.discount;

    if (type === CouponType.FIXED && discount < 1) {
      throw new BadRequestException('满减券的减免金额不能小于1分');
    }
    if (type === CouponType.PERCENTAGE && (discount < 1 || discount > 99)) {
      throw new BadRequestException('折扣券的折扣百分比必须在1-99之间');
    }

    // 如果更新了 totalCount，同步更新 remainingCount
    if (updateCouponDto.totalCount !== undefined) {
      const diff = updateCouponDto.totalCount - coupon.totalCount;
      const newRemaining = coupon.remainingCount + diff;
      (coupon as any).remainingCount = newRemaining < 0 ? 0 : newRemaining;
    }

    Object.assign(coupon, updateCouponDto);
    return this.couponRepository.save(coupon);
  }

  /**
   * 启用/禁用优惠券
   * @param id 优惠券ID
   * @param isActive 是否启用
   * @returns 更新后的优惠券对象
   */
  async toggleActive(id: number, isActive: boolean): Promise<Coupon> {
    const coupon = await this.findOne(id);
    coupon.isActive = isActive;
    return this.couponRepository.save(coupon);
  }

  /**
   * 删除优惠券（物理删除）
   * @param id 优惠券ID
   * @throws NotFoundException 优惠券不存在
   */
  async remove(id: number): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  // ================================================================
  // 优惠券领取与使用（制作人端）
  // ================================================================

  /**
   * 用户领取优惠券
   * 功能描述：根据优惠券码领取优惠券，校验有效期、库存、每人限领等
   * @param userId 用户ID
   * @param code 优惠券码
   * @returns 用户优惠券记录
   * @throws NotFoundException 优惠券不存在
   * @throws BadRequestException 优惠券不可用
   */
  async claimCoupon(userId: number, code: string): Promise<UserCoupon> {
    // 查找优惠券
    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 校验：优惠券是否启用
    if (!coupon.isActive) {
      throw new BadRequestException('该优惠券已停用');
    }

    // 校验：有效期
    const now = new Date();
    if (now < coupon.startTime) {
      throw new BadRequestException('该优惠券尚未到领取时间');
    }
    if (now > coupon.endTime) {
      throw new BadRequestException('该优惠券已过期');
    }

    // 校验：总库存
    if (coupon.totalCount !== -1 && coupon.remainingCount <= 0) {
      throw new BadRequestException('该优惠券已被领完');
    }

    // 校验：每人限领
    if (coupon.perUserLimit > 0) {
      const userClaimCount = await this.userCouponRepository.count({
        where: { userId, couponId: coupon.id },
      });
      if (userClaimCount >= coupon.perUserLimit) {
        throw new BadRequestException(`该优惠券每人限领${coupon.perUserLimit}张`);
      }
    }

    // 使用事务：创建用户优惠券记录并扣减库存
    const userCoupon = await this.dataSource.transaction(async (manager) => {
      // 扣减库存
      if (coupon.totalCount !== -1) {
        await manager.decrement(Coupon, { id: coupon.id }, 'remainingCount', 1);
      }

      // 创建用户优惠券记录
      const record = this.userCouponRepository.create({
        userId,
        couponId: coupon.id,
        status: 'unused',
      });
      return manager.save(UserCoupon, record);
    });

    return userCoupon;
  }

  /**
   * 获取用户可用的优惠券列表
   * 功能描述：返回当前用户所有未使用且未过期的优惠券，附带优惠券详细信息
   * @param userId 用户ID
   * @returns 可用优惠券列表
   */
  async getUserAvailableCoupons(userId: number): Promise<any[]> {
    const now = new Date();

    // 查询用户已领取的未使用优惠券
    const userCoupons = await this.userCouponRepository.find({
      where: { userId, status: 'unused' },
      relations: ['coupon'],
    });

    // 过滤出未过期的优惠券
    const availableCoupons = userCoupons.filter((uc) => {
      if (!uc.coupon) return false;
      if (!uc.coupon.isActive) return false;
      if (now < uc.coupon.startTime || now > uc.coupon.endTime) return false;
      return true;
    });

    return availableCoupons.map((uc) => ({
      id: uc.id,
      userId: uc.userId,
      couponId: uc.couponId,
      status: uc.status,
      createdAt: uc.createdAt,
      coupon: uc.coupon,
    }));
  }

  /**
   * 获取用户优惠券列表（含已使用/已过期）
   * @param userId 用户ID
   * @returns 用户所有优惠券记录
   */
  async getUserAllCoupons(userId: number): Promise<any[]> {
    const userCoupons = await this.userCouponRepository.find({
      where: { userId },
      relations: ['coupon'],
      order: { createdAt: 'DESC' },
    });

    return userCoupons;
  }

  /**
   * 使用优惠券
   * 功能描述：校验优惠券是否可用，并计算优惠后的金额
   * 注意：此方法仅做校验和计算，实际扣减在使用完成后由 useCouponForOrder 完成
   *
   * @param userId 用户ID
   * @param userCouponId 用户优惠券记录ID
   * @param orderAmount 订单金额（单位：分）
   * @returns 优惠计算信息
   * @throws NotFoundException 优惠券不存在
   * @throws BadRequestException 优惠券不可用
   */
  async calculateDiscount(
    userId: number,
    userCouponId: number,
    orderAmount: number,
  ): Promise<{
    discountAmount: number;
    finalAmount: number;
    coupon: Coupon;
  }> {
    const userCoupon = await this.userCouponRepository.findOne({
      where: { id: userCouponId, userId },
      relations: ['coupon'],
    });

    if (!userCoupon) {
      throw new NotFoundException('未找到该优惠券记录');
    }

    if (userCoupon.status !== 'unused') {
      throw new BadRequestException('该优惠券已被使用或已过期');
    }

    const coupon = userCoupon.coupon;
    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 校验：优惠券是否启用
    if (!coupon.isActive) {
      throw new BadRequestException('该优惠券已停用');
    }

    // 校验：有效期
    const now = new Date();
    if (now < coupon.startTime) {
      throw new BadRequestException('该优惠券尚未到使用时间');
    }
    if (now > coupon.endTime) {
      throw new BadRequestException('该优惠券已过期');
    }

    // 校验：最低使用门槛
    if (orderAmount < coupon.minAmount) {
      const minYuan = (coupon.minAmount / 100).toFixed(2);
      throw new BadRequestException(`该订单未达到最低使用门槛（满${minYuan}元可用）`);
    }

    // 计算优惠金额
    let discountAmount = 0;

    if (coupon.type === CouponType.FIXED) {
      // 满减券：直接减免固定金额
      discountAmount = coupon.discount;
    } else {
      // 折扣券：按百分比减免
      discountAmount = Math.floor(orderAmount * coupon.discount / 100);
      // 如果设置了最大减免金额，取两者较小值
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    // 优惠金额不能超过订单金额
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    const finalAmount = orderAmount - discountAmount;

    return {
      discountAmount,
      finalAmount,
      coupon,
    };
  }

  /**
   * 将优惠券标记为已使用（订单支付成功后调用）
   * @param userCouponId 用户优惠券记录ID
   * @param userId 用户ID
   * @param orderId 订单ID
   */
  async useCouponForOrder(
    userCouponId: number,
    userId: number,
    orderId: number,
  ): Promise<void> {
    const userCoupon = await this.userCouponRepository.findOne({
      where: { id: userCouponId, userId },
    });

    if (!userCoupon) {
      throw new NotFoundException('未找到该优惠券记录');
    }

    if (userCoupon.status !== 'unused') {
      throw new BadRequestException('该优惠券已被使用');
    }

    userCoupon.status = 'used';
    userCoupon.usedAt = new Date();
    userCoupon.orderId = orderId;
    await this.userCouponRepository.save(userCoupon);
  }

  // ================================================================
  // 优惠券统计（管理端）
  // ================================================================

  /**
   * 获取优惠券统计信息
   * @param couponId 优惠券ID（可选，统计单个）
   * @returns 统计信息
   */
  async getCouponStats(couponId?: number) {
    const queryBuilder = this.userCouponRepository
      .createQueryBuilder('uc')
      .select('uc.couponId', 'couponId')
      .addSelect('COUNT(*)', 'totalClaimed')
      .addSelect("SUM(CASE WHEN uc.status = 'used' THEN 1 ELSE 0 END)", 'usedCount')
      .addSelect("SUM(CASE WHEN uc.status = 'unused' THEN 1 ELSE 0 END)", 'unusedCount');

    if (couponId) {
      queryBuilder.where('uc.couponId = :couponId', { couponId });
    }

    queryBuilder.groupBy('uc.couponId');

    return queryBuilder.getRawMany();
  }
}
