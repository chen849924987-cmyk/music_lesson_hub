import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlipaySdk } from 'alipay-sdk';

/**
 * 支付宝 SDK 配置提供者
 * 功能描述：基于 NestJS ConfigService 初始化支付宝 SDK 实例，支持沙箱/生产环境切换
 *
 * 环境变量说明：
 * - ALIPAY_APP_ID: 支付宝开放平台应用ID
 * - ALIPAY_PRIVATE_KEY: 应用私钥（PKCS8 格式）
 * - ALIPAY_PUBLIC_KEY: 支付宝公钥
 * - ALIPAY_GATEWAY: 支付宝网关地址（沙箱 https://openapi-sandbox.dl.alipaydev.com/gateway.do）
 * - ALIPAY_NOTIFY_URL: 支付异步通知回调地址
 * - ALIPAY_RETURN_URL: 支付同步跳转地址
 */
@Injectable()
export class AlipayConfig {
  private readonly logger = new Logger(AlipayConfig.name);

  /** 支付宝 SDK 实例 */
  public readonly sdk: AlipaySdk;

  /** 应用 ID */
  public readonly appId: string;

  /** 支付异步通知回调地址 */
  public readonly notifyUrl: string;

  /** 支付同步跳转地址（用户支付完成后的跳转） */
  public readonly returnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('ALIPAY_APP_ID', '');
    const privateKey = this.configService.get<string>('ALIPAY_PRIVATE_KEY', '');
    const alipayPublicKey = this.configService.get<string>('ALIPAY_PUBLIC_KEY', '');
    const gateway = this.configService.get<string>(
      'ALIPAY_GATEWAY',
      'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    );

    this.notifyUrl = this.configService.get<string>(
      'ALIPAY_NOTIFY_URL',
      'http://localhost:3000/api/v1/payments/notify',
    );
    this.returnUrl = this.configService.get<string>(
      'ALIPAY_RETURN_URL',
      'http://localhost:5173/payment/success',
    );

    // 如果配置了支付宝参数，初始化 SDK
    if (this.appId && privateKey && alipayPublicKey) {
      this.sdk = new AlipaySdk({
        appId: this.appId,
        privateKey,
        alipayPublicKey,
        gateway,
        keyType: 'PKCS8',
        signType: 'RSA2',
      });
      this.logger.log(`支付宝 SDK 初始化成功，网关: ${gateway}`);
    } else {
      this.logger.warn('支付宝参数未完整配置，SDK 未初始化（支付功能不可用）');
      this.sdk = null as unknown as AlipaySdk;
    }
  }

  /**
   * 检查支付宝 SDK 是否可用
   * @returns 是否已初始化
   */
  isAvailable(): boolean {
    return this.sdk !== null;
  }
}
