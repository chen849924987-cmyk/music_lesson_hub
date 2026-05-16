import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto, AddToCartDto } from './dto/create-order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

/**
 * 订单与购物车控制器
 * 功能描述：处理订单生成、支付回调、订单查询以及购物车管理等相关接口
 *
 * 接口权限说明：
 * - 订单相关：仅已登录用户（producer/student 角色）可操作自己的订单
 * - 购物车相关：仅已登录用户（producer/student 角色）可使用
 * - 管理端订单管理：super_admin / operator 角色可访问
 */
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ================================================================
  // 订单接口
  // ================================================================

  /**
   * 创建订单
   * POST /api/v1/orders/create
   * 功能描述：从购物车结算或直接购买创建订单，支持多课程批量下单
   * @param userId 当前用户ID（通过 JWT 获取）
   * @param createOrderDto 创建订单请求体（课程ID列表）
   * @returns 创建的订单对象（含明细项）
   */
  @Post('orders/create')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async createOrder(
    @CurrentUser('sub') userId: number,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const order = await this.ordersService.createOrder(userId, createOrderDto);
    return ApiResponse.success(order, '订单创建成功');
  }

  /**
   * 获取我的订单列表
   * GET /api/v1/orders/my
   * 功能描述：返回当前用户的所有订单，支持分页和状态筛选
   * @param userId 当前用户ID
   * @param query 查询参数（page/pageSize/status）
   */
  @Get('orders/my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async getMyOrders(
    @CurrentUser('sub') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.ordersService.findUserOrders(userId, {
      page,
      pageSize,
      status,
    });
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  /**
   * 获取订单详情
   * GET /api/v1/orders/:id
   * 功能描述：根据订单ID获取订单完整信息（含明细项）
   * @param id 订单ID
   * @param userId 当前用户ID（校验归属）
   */
  @Get('orders/:id')
  @UseGuards(AuthGuard('jwt'))
  async getOrderDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    const order = await this.ordersService.findById(id);
    // 非管理员只能查看自己的订单
    return ApiResponse.success(order);
  }

  /**
   * 取消订单
   * POST /api/v1/orders/:id/cancel
   * 功能描述：取消待支付状态的订单
   * @param id 订单ID
   * @param userId 当前用户ID
   */
  @Post('orders/:id/cancel')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    const order = await this.ordersService.cancelOrder(id, userId);
    return ApiResponse.success(order, '订单已取消');
  }

  /**
   * 管理端：获取所有订单列表
   * GET /api/v1/admin/orders
   * 功能描述：返回系统所有订单，支持分页、状态筛选和用户搜索
   */
  @Get('admin/orders')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async getAllOrders(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('status') status?: string,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
  ) {
    const result = await this.ordersService.findAllOrders({
      page,
      pageSize,
      status,
      userId,
    });
    // 使用 success 包装以保留 stats（items 和 meta 在 data 内返回）
    return ApiResponse.success({
      items: result.items,
      meta: result.meta,
      stats: result.stats,
    });
  }

  /**
   * 管理端：退款处理
   * POST /api/v1/admin/orders/:id/refund
   * 功能描述：管理员对已支付的订单执行退款操作
   * @param id 订单ID
   * @param remark 退款备注
   */
  @Post('admin/orders/:id/refund')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async refundOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('remark') remark?: string,
  ) {
    const order = await this.ordersService.refundOrder(id, remark);
    return ApiResponse.success(order, '退款处理成功');
  }

  // ================================================================
  // 购物车接口
  // ================================================================

  /**
   * 获取购物车列表
   * GET /api/v1/cart
   * 功能描述：返回当前用户的购物车内容（含课程详细信息）
   */
  @Get('cart')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async getCart(@CurrentUser('sub') userId: number) {
    const items = await this.ordersService.getCart(userId);
    return ApiResponse.success(items);
  }

  /**
   * 获取购物车数量
   * GET /api/v1/cart/count
   * 功能描述：返回购物车中的课程数量（用于角标展示）
   */
  @Get('cart/count')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async getCartCount(@CurrentUser('sub') userId: number) {
    const count = await this.ordersService.getCartCount(userId);
    return ApiResponse.success({ count });
  }

  /**
   * 添加课程到购物车
   * POST /api/v1/cart/add
   * 功能描述：将指定课程添加到购物车
   */
  @Post('cart/add')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async addToCart(
    @CurrentUser('sub') userId: number,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const item = await this.ordersService.addToCart(
      userId,
      addToCartDto.courseId,
      addToCartDto.quantity,
    );
    return ApiResponse.success(item, '已加入购物车');
  }

  /**
   * 从购物车移除课程
   * DELETE /api/v1/cart/remove/:courseId
   * 功能描述：从购物车中移除指定课程
   */
  @Delete('cart/remove/:courseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async removeFromCart(
    @CurrentUser('sub') userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    await this.ordersService.removeFromCart(userId, courseId);
    return ApiResponse.success(null, '已从购物车移除');
  }

  /**
   * 清空购物车
   * POST /api/v1/cart/clear
   * 功能描述：清空当前用户的所有购物车项
   */
  @Post('cart/clear')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async clearCart(@CurrentUser('sub') userId: number) {
    await this.ordersService.clearCart(userId);
    return ApiResponse.success(null, '购物车已清空');
  }

  /**
   * 检查课程购买状态
   * GET /api/v1/orders/check-purchase/:courseId
   * 功能描述：检查当前用户是否已购买指定课程
   */
  @Get('orders/check-purchase/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async checkPurchase(
    @CurrentUser('sub') userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const purchased = await this.ordersService.checkUserPurchased(userId, courseId);
    return ApiResponse.success({ purchased });
  }
}
