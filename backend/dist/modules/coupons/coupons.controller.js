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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const coupons_service_1 = require("./coupons.service");
const create_coupon_dto_1 = require("./dto/create-coupon.dto");
const update_coupon_dto_1 = require("./dto/update-coupon.dto");
const query_coupon_dto_1 = require("./dto/query-coupon.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
let CouponsController = class CouponsController {
    couponsService;
    constructor(couponsService) {
        this.couponsService = couponsService;
    }
    async create(createCouponDto) {
        const coupon = await this.couponsService.create(createCouponDto);
        return response_dto_1.ApiResponse.success(coupon, '优惠券创建成功');
    }
    async findAll(queryDto) {
        const result = await this.couponsService.findAll(queryDto);
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async findOne(id) {
        const coupon = await this.couponsService.findOne(id);
        return response_dto_1.ApiResponse.success(coupon);
    }
    async update(id, updateCouponDto) {
        const coupon = await this.couponsService.update(id, updateCouponDto);
        return response_dto_1.ApiResponse.success(coupon, '优惠券更新成功');
    }
    async toggleActive(id, isActive) {
        const coupon = await this.couponsService.toggleActive(id, isActive);
        return response_dto_1.ApiResponse.success(coupon, isActive ? '优惠券已启用' : '优惠券已停用');
    }
    async remove(id) {
        await this.couponsService.remove(id);
        return response_dto_1.ApiResponse.success(null, '优惠券已删除');
    }
    async getStats(couponId) {
        const stats = await this.couponsService.getCouponStats(couponId ? parseInt(couponId) : undefined);
        return response_dto_1.ApiResponse.success(stats);
    }
    async claimCoupon(userId, code) {
        const userCoupon = await this.couponsService.claimCoupon(userId, code);
        return response_dto_1.ApiResponse.success(userCoupon, '优惠券领取成功');
    }
    async getAvailableCoupons(userId) {
        const coupons = await this.couponsService.getUserAvailableCoupons(userId);
        return response_dto_1.ApiResponse.success(coupons);
    }
    async getMyCoupons(userId) {
        const coupons = await this.couponsService.getUserAllCoupons(userId);
        return response_dto_1.ApiResponse.success(coupons);
    }
    async calculateDiscount(userId, userCouponId, orderAmount) {
        const result = await this.couponsService.calculateDiscount(userId, userCouponId, orderAmount);
        return response_dto_1.ApiResponse.success(result);
    }
};
exports.CouponsController = CouponsController;
__decorate([
    (0, common_1.Post)('admin/coupons'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_coupon_dto_1.CreateCouponDto]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('admin/coupons'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_coupon_dto_1.QueryCouponDto]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('admin/coupons/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)('admin/coupons/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_coupon_dto_1.UpdateCouponDto]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('admin/coupons/:id/toggle-active'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Delete)('admin/coupons/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('admin/coupons/stats/all'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Query)('couponId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('coupons/claim'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "claimCoupon", null);
__decorate([
    (0, common_1.Get)('coupons/available'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "getAvailableCoupons", null);
__decorate([
    (0, common_1.Get)('coupons/my'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "getMyCoupons", null);
__decorate([
    (0, common_1.Post)('coupons/calculate'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)('userCouponId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('orderAmount', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "calculateDiscount", null);
exports.CouponsController = CouponsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [coupons_service_1.CouponsService])
], CouponsController);
//# sourceMappingURL=coupons.controller.js.map