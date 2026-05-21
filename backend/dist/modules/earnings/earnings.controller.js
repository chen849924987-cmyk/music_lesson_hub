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
exports.EarningsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const earnings_service_1 = require("./earnings.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
const teachers_service_1 = require("../teachers/teachers.service");
const create_withdrawal_dto_1 = require("./dto/create-withdrawal.dto");
let EarningsController = class EarningsController {
    earningsService;
    teachersService;
    constructor(earningsService, teachersService) {
        this.earningsService = earningsService;
        this.teachersService = teachersService;
    }
    async getTeacherStats(userId) {
        const teacher = await this.teachersService.findByUserId(userId);
        const stats = await this.earningsService.getTeacherEarningStats(teacher.id);
        return response_dto_1.ApiResponse.success({
            totalEarnings: stats.totalEarnings / 100,
            balance: stats.balance / 100,
            pendingSettlement: stats.pendingSettlement / 100,
            totalWithdrawn: stats.totalWithdrawn / 100,
            paymentAccount: teacher.paymentAccount || '',
            bankAccount: teacher.bankAccount || '',
            bankBranch: teacher.bankBranch || '',
        });
    }
    async getEarningDetail(userId, page, pageSize, startDate, endDate) {
        const teacher = await this.teachersService.findByUserId(userId);
        const result = await this.earningsService.getTeacherEarningDetail(teacher.id, {
            page,
            pageSize,
            startDate,
            endDate,
        });
        const items = result.items.map((item) => ({
            ...item,
            amount: item.amount / 100,
            actualAmount: item.actualAmount / 100,
            platformShare: item.platformShare / 100,
        }));
        return response_dto_1.ApiResponse.successWithPagination(items, result.meta);
    }
    async applyWithdrawal(userId, dto) {
        const teacher = await this.teachersService.findByUserId(userId);
        const withdrawal = await this.earningsService.applyWithdrawal(teacher.id, dto);
        return response_dto_1.ApiResponse.success({
            id: withdrawal.id,
            amount: withdrawal.amount / 100,
            accountInfo: withdrawal.accountInfo,
            status: withdrawal.status,
            createdAt: withdrawal.createdAt,
        }, '提现申请已提交');
    }
    async getWithdrawals(userId, page, pageSize) {
        const teacher = await this.teachersService.findByUserId(userId);
        const result = await this.earningsService.getTeacherWithdrawals(teacher.id, page || 1, pageSize || 20);
        const items = result.items.map((item) => ({
            ...item,
            amount: item.amount / 100,
        }));
        return response_dto_1.ApiResponse.successWithPagination(items, result.meta);
    }
    async getAllWithdrawals(page, pageSize, status) {
        const result = await this.earningsService.getAllWithdrawals(page || 1, pageSize || 20, status);
        const items = result.items.map((item) => ({
            ...item,
            amount: item.amount / 100,
            teacher: item.teacher ? { id: item.teacher.id, realName: item.teacher.realName } : null,
        }));
        return response_dto_1.ApiResponse.successWithPagination(items, result.meta);
    }
    async reviewWithdrawal(id, userId, dto) {
        const withdrawal = await this.earningsService.reviewWithdrawal(id, userId, dto.action, dto.remark);
        return response_dto_1.ApiResponse.success({
            id: withdrawal.id,
            status: withdrawal.status,
            amount: withdrawal.amount / 100,
            remark: withdrawal.remark,
            processedAt: withdrawal.processedAt,
        }, dto.action === 'approved' ? '提现审核通过' : '提现已驳回');
    }
    async getPendingWithdrawalCount() {
        const count = await this.earningsService.countPendingWithdrawals();
        return response_dto_1.ApiResponse.success({ count });
    }
    async getPlatformStats() {
        const stats = await this.earningsService.getPlatformEarningStats();
        return response_dto_1.ApiResponse.success({
            totalRevenue: stats.totalRevenue / 100,
            platformIncome: stats.platformIncome / 100,
            teacherEarnings: stats.teacherEarnings / 100,
            totalWithdrawn: stats.totalWithdrawn / 100,
            orderCount: stats.orderCount,
        });
    }
    async getPlatformTrend(days) {
        const trend = await this.earningsService.getPlatformEarningTrend(days || 30);
        return response_dto_1.ApiResponse.success(trend.map((item) => ({
            ...item,
            revenue: item.revenue / 100,
            platformIncome: item.platformIncome / 100,
            teacherEarnings: item.teacherEarnings / 100,
        })));
    }
    async getTopCourses(limit) {
        const topCourses = await this.earningsService.getTopEarningCourses(limit || 10);
        return response_dto_1.ApiResponse.success(topCourses.map((item) => ({
            ...item,
            totalAmount: item.totalAmount / 100,
        })));
    }
    async getTopTeachers(limit) {
        const topTeachers = await this.earningsService.getTopEarningTeachers(limit || 10);
        return response_dto_1.ApiResponse.success(topTeachers.map((item) => ({
            ...item,
            totalAmount: item.totalAmount / 100,
        })));
    }
};
exports.EarningsController = EarningsController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getTeacherStats", null);
__decorate([
    (0, common_1.Get)('detail'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getEarningDetail", null);
__decorate([
    (0, common_1.Post)('withdrawals'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_withdrawal_dto_1.CreateWithdrawalDto]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "applyWithdrawal", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getWithdrawals", null);
__decorate([
    (0, common_1.Get)('admin/withdrawals'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(1, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getAllWithdrawals", null);
__decorate([
    (0, common_1.Post)('admin/withdrawals/:id/review'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, create_withdrawal_dto_1.ReviewWithdrawalDto]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "reviewWithdrawal", null);
__decorate([
    (0, common_1.Get)('admin/pending-count'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getPendingWithdrawalCount", null);
__decorate([
    (0, common_1.Get)('admin/platform-stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getPlatformStats", null);
__decorate([
    (0, common_1.Get)('admin/trend'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('days', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getPlatformTrend", null);
__decorate([
    (0, common_1.Get)('admin/top-courses'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getTopCourses", null);
__decorate([
    (0, common_1.Get)('admin/top-teachers'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EarningsController.prototype, "getTopTeachers", null);
exports.EarningsController = EarningsController = __decorate([
    (0, common_1.Controller)('earnings'),
    __metadata("design:paramtypes", [earnings_service_1.EarningsService,
        teachers_service_1.TeachersService])
], EarningsController);
//# sourceMappingURL=earnings.controller.js.map