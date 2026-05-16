import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { AlipayConfig } from '../../config/alipay.config';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../../common/constants';

/**
 * 支付服务
 * 功能描述：处理支付宝支付相关的业务逻辑，包括创建支付、异步通知验签、支付状态查询、退款处理
 *
 * 支付流程：
 * 1. 前端调用 POST /payments/create 传入订单ID
 * 2. 服务端校验订单状态（须为待支付），调用支付宝 API 生成支付链接
 * 3. 用户跳转支付宝完成支付
 * 4. 支付宝异步通知 POST /payments/notify，服务端验签后更新订单状态
 * 5. 前端轮询支付结果或跳转支付成功页
 *
 * 退款流程：
 * 1. 管理端调用 POST /admin/payments/refund
 * 2. 服务端调用支付宝退款 API
 * 3. 更新订单状态为已退款，撤销 UserCourse 关联
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly alipayConfig: AlipayConfig,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * 创建支付宝支付
   * 功能描述：根据订单ID生成支付宝支付页面链接（电脑网站支付）
   * @param orderId 订单ID
   * @param userId 当前用户ID（校验归属）
   * @returns 支付表单HTML或支付链接
   * @throws BadRequestException 支付宝未配置/订单状态异常
   */
  async createPayment(orderId: number, userId: number): Promise<{ payUrl: string }> {
    const order = await this.ordersService.findById(orderId);

    if (order.userId !== userId) {
      throw new BadRequestException('无权操作此订单');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('仅待支付状态的订单可以发起支付');
    }

    if (!this.alipayConfig.isAvailable()) {
      throw new BadRequestException('支付宝支付功能未配置，请联系管理员');
    }

    try {
      const bizContent = {
        out_trade_no: order.orderNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: (order.totalAmount / 100).toFixed(2),
        subject: `SoundCraft 课程购买 - ${order.orderNo}`,
        body: '在线教育课程购买',
      };

      const payUrl = this.alipayConfig.sdk.pageExecute('alipay.trade.page.pay', 'GET', {
        bizContent,
        returnUrl: this.alipayConfig.returnUrl,
        notifyUrl: this.alipayConfig.notifyUrl,
      });

      this.logger.log(`支付宝支付链接生成成功，订单号: ${order.orderNo}`);
      return { payUrl };
    } catch (error) {
      this.logger.error(`支付宝支付链接生成失败: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException(`支付请求处理失败: ${(error as Error).message}`);
    }
  }

  /**
   * 处理支付宝异步通知
   * 功能描述：接收支付宝异步通知，验签后更新订单状态和 UserCourse 关联
   * @param notifyData 支付宝异步通知的参数对象
   * @returns 'success' 或 'fail'
   */
  async handleNotify(notifyData: Record<string, any>): Promise<string> {
    this.logger.log(`收到支付宝异步通知: ${JSON.stringify(notifyData)}`);

    const verified = this.alipayConfig.sdk.checkNotifySignV2(notifyData);
    if (!verified) {
      this.logger.error(`支付宝通知签名验证失败: ${JSON.stringify(notifyData)}`);
      return 'fail';
    }
    this.logger.log('支付宝通知签名验证通过');

    const { out_trade_no, trade_status, trade_no, total_amount } = notifyData;

    if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
      this.logger.warn(`未处理的交易状态: ${trade_status}，订单号: ${out_trade_no}`);
      return 'success';
    }

    try {
      const order = await this.ordersService.findByOrderNo(out_trade_no);
      const paidAmount = Math.round(parseFloat(total_amount) * 100);
      if (order.totalAmount !== paidAmount) {
        this.logger.error(`支付金额不匹配！订单号: ${out_trade_no}，期望: ${order.totalAmount}，实际: ${paidAmount}`);
        return 'fail';
      }
      if (order.status === OrderStatus.PAID) {
        this.logger.warn(`订单 ${out_trade_no} 已支付，跳过重复处理`);
        return 'success';
      }
      await this.ordersService.paySuccess(order.id, trade_no);
      this.logger.log(`订单 ${out_trade_no} 支付成功，交易号: ${trade_no}`);
      return 'success';
    } catch (error) {
      this.logger.error(`处理支付宝通知失败: ${(error as Error).message}`, (error as Error).stack);
      return 'fail';
    }
  }

  /**
   * 查询支付状态
   * @param orderNo 订单号
   * @returns 交易状态
   */
  async queryPaymentStatus(orderNo: string): Promise<{ status: string; tradeNo?: string }> {
    try {
      const order = await this.ordersService.findByOrderNo(orderNo);
      return { status: order.status, tradeNo: order.tradeNo || undefined };
    } catch {
      throw new NotFoundException('订单不存在');
    }
  }

  /**
   * 手动确认支付（备用方案）
   * 功能描述：当支付宝异步通知失败时，前端可调用此接口手动确认支付状态
   * 流程：调用支付宝查询接口 → 如果已支付 → 更新本地订单
   * @param orderNo 订单号
   * @param userId 当前用户ID
   * @returns 更新后的订单
   */
  async confirmPayment(orderNo: string, userId: number) {
    try {
      const order = await this.ordersService.findByOrderNo(orderNo);

      // 校验归属
      if (order.userId !== userId) {
        throw new BadRequestException('无权操作此订单');
      }

      // 如果已支付，直接返回
      if (order.status === OrderStatus.PAID) {
        return order;
      }

      // 校验订单状态（仅待支付可确认）
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('订单状态异常，无法确认支付');
      }

      // 查询支付宝交易状态（如果SDK可用）
      if (this.alipayConfig.isAvailable()) {
        try {
          this.logger.log(`正在查询支付宝交易状态，订单号: ${orderNo}`);
          const result = await this.alipayConfig.sdk.exec('alipay.trade.query', {
            bizContent: { out_trade_no: orderNo },
          });

          // alipay-sdk v4.x 的 exec() 返回结果即响应对象本身（驼峰属性）
          this.logger.log(
            `支付宝交易查询响应: tradeStatus=${result?.tradeStatus}, ` +
            `code=${result?.code}, subCode=${result?.subCode}, ` +
            `subMsg=${result?.subMsg}`
          );
          this.logger.log(`支付宝交易查询完整 result: ${JSON.stringify(result)}`);

          if (result) {
            if (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED') {
              // 更新订单状态
              return await this.ordersService.paySuccess(order.id, result.tradeNo || '');
            } else if (result.code && result.code !== '10000') {
              // Alipay API 返回错误码（非 10000 表示调用失败）
              this.logger.warn(`支付宝交易查询 API 返回错误: code=${result.code}, subCode=${result.subCode}, subMsg=${result.subMsg}`);

              let detail: string;
              if (result.subCode === 'isv.invalid-app-id') {
                detail = 'AppId 无效或应用公钥未上传到支付宝开放平台';
              } else if (result.subCode === 'ACQ.TRADE_NOT_EXIST') {
                detail = '该交易在支付宝中不存在（用户可能未完成支付）';
              } else {
                detail = `支付宝返回: ${result.subMsg || result.subCode || '未知错误'}`;
              }
              throw new BadRequestException(`支付确认失败: ${detail}`);
            } else {
              // code === '10000' 但 tradeStatus 不是 TRADE_SUCCESS
              this.logger.warn(`支付宝交易查询返回非成功状态: tradeStatus=${result.tradeStatus}`);
            }
          } else {
            this.logger.warn('支付宝交易查询结果为 null/undefined');
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error; // 透传业务异常
          }
          this.logger.warn(`支付宝查询接口调用失败: ${(error as Error).message}`);
          if ((error as Error).message?.includes('isv.invalid-app-id')) {
            throw new BadRequestException('支付宝 AppId 与密钥不匹配，请确认已在支付宝开放平台上传正确的应用公钥');
          }
        }
      }

      throw new BadRequestException('支付未完成，请稍后重试');
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`支付确认失败: ${(error as Error).message}`);
    }
  }
}
