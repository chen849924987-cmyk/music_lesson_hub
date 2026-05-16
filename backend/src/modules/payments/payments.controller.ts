import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';
import type { Request, Response } from 'express';

/**
 * 支付控制器
 * 功能描述：处理支付宝支付相关的 HTTP 接口，包括创建支付、异步通知、支付状态查询
 *
 * 接口说明：
 * - 支付相关接口仅已登录用户可调用
 * - 异步通知接口对支付宝开放（无认证）
 * - 管理端退款接口需 super_admin / operator 权限
 */
@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * 创建支付宝支付
   * POST /api/v1/payments/create
   * 功能描述：根据订单ID生成支付宝支付链接
   * @param userId 当前用户ID
   * @param body { orderId: number } 订单ID
   * @returns 支付跳转链接
   */
  @Post('payments/create')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async createPayment(
    @CurrentUser('sub') userId: number,
    @Body('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.paymentsService.createPayment(orderId, userId);
    return ApiResponse.success(result, '支付链接生成成功');
  }

  /**
   * 支付宝异步通知回调
   * POST /api/v1/payments/notify
   * 功能描述：接收支付宝异步通知，验签后更新订单状态
   * 注意：此接口不对应返回 JSON，而是返回 'success' 或 'fail' 字符串
   */
  @Post('payments/notify')
  async handleNotify(@Req() req: Request, @Res() res: Response) {
    try {
      // 支付宝通知以 application/x-www-form-urlencoded 格式发送
      const notifyData: Record<string, any> = {};
      for (const [key, value] of Object.entries(req.body || {})) {
        notifyData[key] = value;
      }

      const result = await this.paymentsService.handleNotify(notifyData);
      res.type('text/plain').send(result);
    } catch (error) {
      this.logger.error(`处理支付宝通知异常: ${(error as Error).message}`);
      res.type('text/plain').send('fail');
    }
  }

  /**
   * 查询支付状态
   * GET /api/v1/payments/query/:orderNo
   * 功能描述：根据订单号查询本地支付状态
   * @param orderNo 订单号
   */
  @Get('payments/query/:orderNo')
  @UseGuards(AuthGuard('jwt'))
  async queryPaymentStatus(@Param('orderNo') orderNo: string) {
    const result = await this.paymentsService.queryPaymentStatus(orderNo);
    return ApiResponse.success(result);
  }

  /**
   * 手动确认支付（备用方案）
   * POST /api/v1/payments/confirm
   * 功能描述：当支付宝异步通知失败时，手动触发支付状态查询和更新
   * @param userId 当前用户ID
   * @param body { orderNo: string } 订单号
   */
  @Post('payments/confirm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async confirmPayment(
    @CurrentUser('sub') userId: number,
    @Body('orderNo') orderNo: string,
  ) {
    const order = await this.paymentsService.confirmPayment(orderNo, userId);
    return ApiResponse.success(order, '支付确认成功');
  }
}
