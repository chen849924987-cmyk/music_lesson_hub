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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const payments_service_1 = require("./payments.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
let PaymentsController = PaymentsController_1 = class PaymentsController {
    paymentsService;
    logger = new common_1.Logger(PaymentsController_1.name);
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async createPayment(userId, orderId) {
        const result = await this.paymentsService.createPayment(orderId, userId);
        return response_dto_1.ApiResponse.success(result, '支付链接生成成功');
    }
    async handleNotify(req, res) {
        try {
            const notifyData = {};
            for (const [key, value] of Object.entries(req.body || {})) {
                notifyData[key] = value;
            }
            const result = await this.paymentsService.handleNotify(notifyData);
            res.type('text/plain').send(result);
        }
        catch (error) {
            this.logger.error(`处理支付宝通知异常: ${error.message}`);
            res.type('text/plain').send('fail');
        }
    }
    async queryPaymentStatus(orderNo) {
        const result = await this.paymentsService.queryPaymentStatus(orderNo);
        return response_dto_1.ApiResponse.success(result);
    }
    async confirmPayment(userId, orderNo) {
        const order = await this.paymentsService.confirmPayment(orderNo, userId);
        return response_dto_1.ApiResponse.success(order, '支付确认成功');
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('payments/create'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)('orderId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Post)('payments/notify'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleNotify", null);
__decorate([
    (0, common_1.Get)('payments/query/:orderNo'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('orderNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "queryPaymentStatus", null);
__decorate([
    (0, common_1.Post)('payments/confirm'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)('orderNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "confirmPayment", null);
exports.PaymentsController = PaymentsController = PaymentsController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map