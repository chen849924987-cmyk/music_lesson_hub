"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const alipay_config_1 = require("../../config/alipay.config");
const orders_service_1 = require("../orders/orders.service");
const constants_1 = require("../../common/constants");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    alipayConfig;
    ordersService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(alipayConfig, ordersService) {
        this.alipayConfig = alipayConfig;
        this.ordersService = ordersService;
    }
    async createPayment(orderId, userId) {
        const order = await this.ordersService.findById(orderId);
        if (order.userId !== userId) {
            throw new common_1.BadRequestException('无权操作此订单');
        }
        if (order.status !== constants_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('仅待支付状态的订单可以发起支付');
        }
        if (!this.alipayConfig.isAvailable()) {
            throw new common_1.BadRequestException('支付宝支付功能未配置，请联系管理员');
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
        }
        catch (error) {
            this.logger.error(`支付宝支付链接生成失败: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`支付请求处理失败: ${error.message}`);
        }
    }
    async handleNotify(notifyData) {
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
            if (order.status === constants_1.OrderStatus.PAID) {
                this.logger.warn(`订单 ${out_trade_no} 已支付，跳过重复处理`);
                return 'success';
            }
            await this.ordersService.paySuccess(order.id, trade_no);
            this.logger.log(`订单 ${out_trade_no} 支付成功，交易号: ${trade_no}`);
            return 'success';
        }
        catch (error) {
            this.logger.error(`处理支付宝通知失败: ${error.message}`, error.stack);
            return 'fail';
        }
    }
    async queryPaymentStatus(orderNo) {
        try {
            const order = await this.ordersService.findByOrderNo(orderNo);
            return { status: order.status, tradeNo: order.tradeNo || undefined };
        }
        catch {
            throw new common_1.NotFoundException('订单不存在');
        }
    }
    async confirmPayment(orderNo, userId) {
        try {
            const order = await this.ordersService.findByOrderNo(orderNo);
            if (order.userId !== userId) {
                throw new common_1.BadRequestException('无权操作此订单');
            }
            if (order.status === constants_1.OrderStatus.PAID) {
                return order;
            }
            if (order.status !== constants_1.OrderStatus.PENDING) {
                throw new common_1.BadRequestException('订单状态异常，无法确认支付');
            }
            if (this.alipayConfig.isAvailable()) {
                try {
                    this.logger.log(`正在查询支付宝交易状态，订单号: ${orderNo}`);
                    const result = await this.alipayConfig.sdk.exec('alipay.trade.query', {
                        bizContent: { out_trade_no: orderNo },
                    });
                    this.logger.log(`支付宝交易查询响应: tradeStatus=${result?.tradeStatus}, ` +
                        `code=${result?.code}, subCode=${result?.subCode}, ` +
                        `subMsg=${result?.subMsg}`);
                    this.logger.log(`支付宝交易查询完整 result: ${JSON.stringify(result)}`);
                    if (result) {
                        if (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED') {
                            return await this.ordersService.paySuccess(order.id, result.tradeNo || '');
                        }
                        else if (result.code && result.code !== '10000') {
                            this.logger.warn(`支付宝交易查询 API 返回错误: code=${result.code}, subCode=${result.subCode}, subMsg=${result.subMsg}`);
                            let detail;
                            if (result.subCode === 'isv.invalid-app-id') {
                                detail = 'AppId 无效或应用公钥未上传到支付宝开放平台';
                            }
                            else if (result.subCode === 'ACQ.TRADE_NOT_EXIST') {
                                detail = '该交易在支付宝中不存在（用户可能未完成支付）';
                            }
                            else {
                                detail = `支付宝返回: ${result.subMsg || result.subCode || '未知错误'}`;
                            }
                            throw new common_1.BadRequestException(`支付确认失败: ${detail}`);
                        }
                        else {
                            this.logger.warn(`支付宝交易查询返回非成功状态: tradeStatus=${result.tradeStatus}`);
                        }
                    }
                    else {
                        this.logger.warn('支付宝交易查询结果为 null/undefined');
                    }
                }
                catch (error) {
                    if (error instanceof common_1.BadRequestException) {
                        throw error;
                    }
                    this.logger.warn(`支付宝查询接口调用失败: ${error.message}`);
                    if (error.message?.includes('isv.invalid-app-id')) {
                        throw new common_1.BadRequestException('支付宝 AppId 与密钥不匹配，请确认已在支付宝开放平台上传正确的应用公钥');
                    }
                }
            }
            throw new common_1.BadRequestException('支付未完成，请稍后重试');
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`支付确认失败: ${error.message}`);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [alipay_config_1.AlipayConfig,
        orders_service_1.OrdersService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map