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
var AlipayConfig_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlipayConfig = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const alipay_sdk_1 = require("alipay-sdk");
let AlipayConfig = AlipayConfig_1 = class AlipayConfig {
    configService;
    logger = new common_1.Logger(AlipayConfig_1.name);
    sdk;
    appId;
    notifyUrl;
    returnUrl;
    constructor(configService) {
        this.configService = configService;
        this.appId = this.configService.get('ALIPAY_APP_ID', '');
        const privateKey = this.configService.get('ALIPAY_PRIVATE_KEY', '');
        const alipayPublicKey = this.configService.get('ALIPAY_PUBLIC_KEY', '');
        const gateway = this.configService.get('ALIPAY_GATEWAY', 'https://openapi-sandbox.dl.alipaydev.com/gateway.do');
        this.notifyUrl = this.configService.get('ALIPAY_NOTIFY_URL', 'http://localhost:3000/api/v1/payments/notify');
        this.returnUrl = this.configService.get('ALIPAY_RETURN_URL', 'http://localhost:5173/payment/success');
        if (this.appId && privateKey && alipayPublicKey) {
            this.sdk = new alipay_sdk_1.AlipaySdk({
                appId: this.appId,
                privateKey,
                alipayPublicKey,
                gateway,
                keyType: 'PKCS8',
                signType: 'RSA2',
            });
            this.logger.log(`支付宝 SDK 初始化成功，网关: ${gateway}`);
        }
        else {
            this.logger.warn('支付宝参数未完整配置，SDK 未初始化（支付功能不可用）');
            this.sdk = null;
        }
    }
    isAvailable() {
        return this.sdk !== null;
    }
};
exports.AlipayConfig = AlipayConfig;
exports.AlipayConfig = AlipayConfig = AlipayConfig_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AlipayConfig);
//# sourceMappingURL=alipay.config.js.map