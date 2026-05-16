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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async createOrder(userId, createOrderDto) {
        const order = await this.ordersService.createOrder(userId, createOrderDto);
        return response_dto_1.ApiResponse.success(order, '订单创建成功');
    }
    async getMyOrders(userId, page, pageSize, status) {
        const result = await this.ordersService.findUserOrders(userId, {
            page,
            pageSize,
            status,
        });
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async getOrderDetail(id, userId) {
        const order = await this.ordersService.findById(id);
        return response_dto_1.ApiResponse.success(order);
    }
    async cancelOrder(id, userId) {
        const order = await this.ordersService.cancelOrder(id, userId);
        return response_dto_1.ApiResponse.success(order, '订单已取消');
    }
    async getAllOrders(page, pageSize, status, userId) {
        const result = await this.ordersService.findAllOrders({
            page,
            pageSize,
            status,
            userId,
        });
        return response_dto_1.ApiResponse.success({
            items: result.items,
            meta: result.meta,
            stats: result.stats,
        });
    }
    async refundOrder(id, remark) {
        const order = await this.ordersService.refundOrder(id, remark);
        return response_dto_1.ApiResponse.success(order, '退款处理成功');
    }
    async getCart(userId) {
        const items = await this.ordersService.getCart(userId);
        return response_dto_1.ApiResponse.success(items);
    }
    async getCartCount(userId) {
        const count = await this.ordersService.getCartCount(userId);
        return response_dto_1.ApiResponse.success({ count });
    }
    async addToCart(userId, addToCartDto) {
        const item = await this.ordersService.addToCart(userId, addToCartDto.courseId, addToCartDto.quantity);
        return response_dto_1.ApiResponse.success(item, '已加入购物车');
    }
    async removeFromCart(userId, courseId) {
        await this.ordersService.removeFromCart(userId, courseId);
        return response_dto_1.ApiResponse.success(null, '已从购物车移除');
    }
    async clearCart(userId) {
        await this.ordersService.clearCart(userId);
        return response_dto_1.ApiResponse.success(null, '购物车已清空');
    }
    async checkPurchase(userId, courseId) {
        const purchased = await this.ordersService.checkUserPurchased(userId, courseId);
        return response_dto_1.ApiResponse.success({ purchased });
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('orders/create'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders/my'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrderDetail", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Get)('admin/orders'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(1, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('userId', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.Post)('admin/orders/:id/refund'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('remark')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "refundOrder", null);
__decorate([
    (0, common_1.Get)('cart'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getCart", null);
__decorate([
    (0, common_1.Get)('cart/count'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getCartCount", null);
__decorate([
    (0, common_1.Post)('cart/add'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_order_dto_1.AddToCartDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "addToCart", null);
__decorate([
    (0, common_1.Delete)('cart/remove/:courseId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "removeFromCart", null);
__decorate([
    (0, common_1.Post)('cart/clear'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "clearCart", null);
__decorate([
    (0, common_1.Get)('orders/check-purchase/:courseId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "checkPurchase", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map