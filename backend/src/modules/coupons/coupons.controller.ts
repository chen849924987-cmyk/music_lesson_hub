import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

/**
 * 优惠券控制器
 * 功能描述：处理优惠券的 CRUD 操作以及用户领取/使用优惠券等接口
 *
 * 接口权限说明：
 * - 管理端接口（/admin/coupons/*）：仅 super_admin 和 operator 可访问
 * - 用户端接口（/coupons/*）：已登录用户可访问
 */
@Controller()
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ================================================================
  // 管理端：优惠券 CRUD
  // ================================================================

  /**
   * 创建优惠券
   * POST /api/v1/admin/coupons
   * 功能描述：管理员创建新的优惠券
   */
  @Post('admin/coupons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async create(@Body() createCouponDto: CreateCouponDto) {
    const coupon = await this.couponsService.create(createCouponDto);
    return ApiResponse.success(coupon, '优惠券创建成功');
  }

  /**
   * 分页查询优惠券列表
   * GET /api/v1/admin/coupons
   * 功能描述：管理员查询所有优惠券，支持分页和筛选
   */
  @Get('admin/coupons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async findAll(@Query() queryDto: QueryCouponDto) {
    const result = await this.couponsService.findAll(queryDto);
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  /**
   * 查询单个优惠券详情
   * GET /api/v1/admin/coupons/:id
   */
  @Get('admin/coupons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const coupon = await this.couponsService.findOne(id);
    return ApiResponse.success(coupon);
  }

  /**
   * 更新优惠券
   * PUT /api/v1/admin/coupons/:id
   */
  @Put('admin/coupons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const coupon = await this.couponsService.update(id, updateCouponDto);
    return ApiResponse.success(coupon, '优惠券更新成功');
  }

  /**
   * 启用/禁用优惠券
   * POST /api/v1/admin/coupons/:id/toggle-active
   */
  @Post('admin/coupons/:id/toggle-active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    const coupon = await this.couponsService.toggleActive(id, isActive);
    return ApiResponse.success(coupon, isActive ? '优惠券已启用' : '优惠券已停用');
  }

  /**
   * 删除优惠券
   * DELETE /api/v1/admin/coupons/:id
   */
  @Delete('admin/coupons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.couponsService.remove(id);
    return ApiResponse.success(null, '优惠券已删除');
  }

  /**
   * 获取优惠券统计数据
   * GET /api/v1/admin/coupons/stats
   */
  @Get('admin/coupons/stats/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async getStats(@Query('couponId') couponId?: string) {
    const stats = await this.couponsService.getCouponStats(
      couponId ? parseInt(couponId) : undefined,
    );
    return ApiResponse.success(stats);
  }

  // ================================================================
  // 用户端：优惠券领取与使用
  // ================================================================

  /**
   * 用户领取优惠券
   * POST /api/v1/coupons/claim
   * 功能描述：用户根据优惠券码领取优惠券
   */
  @Post('coupons/claim')
  @UseGuards(AuthGuard('jwt'))
  async claimCoupon(
    @CurrentUser('sub') userId: number,
    @Body('code') code: string,
  ) {
    const userCoupon = await this.couponsService.claimCoupon(userId, code);
    return ApiResponse.success(userCoupon, '优惠券领取成功');
  }

  /**
   * 获取用户可用优惠券列表
   * GET /api/v1/coupons/available
   */
  @Get('coupons/available')
  @UseGuards(AuthGuard('jwt'))
  async getAvailableCoupons(@CurrentUser('sub') userId: number) {
    const coupons = await this.couponsService.getUserAvailableCoupons(userId);
    return ApiResponse.success(coupons);
  }

  /**
   * 获取用户全部优惠券
   * GET /api/v1/coupons/my
   */
  @Get('coupons/my')
  @UseGuards(AuthGuard('jwt'))
  async getMyCoupons(@CurrentUser('sub') userId: number) {
    const coupons = await this.couponsService.getUserAllCoupons(userId);
    return ApiResponse.success(coupons);
  }

  /**
   * 计算优惠券折扣
   * POST /api/v1/coupons/calculate
   * 功能描述：用户在下单前计算优惠券可减免金额
   */
  @Post('coupons/calculate')
  @UseGuards(AuthGuard('jwt'))
  async calculateDiscount(
    @CurrentUser('sub') userId: number,
    @Body('userCouponId', ParseIntPipe) userCouponId: number,
    @Body('orderAmount', ParseIntPipe) orderAmount: number,
  ) {
    const result = await this.couponsService.calculateDiscount(
      userId,
      userCouponId,
      orderAmount,
    );
    return ApiResponse.success(result);
  }
}
