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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCoupon = void 0;
const typeorm_1 = require("typeorm");
const coupon_entity_1 = require("./coupon.entity");
let UserCoupon = class UserCoupon {
    id;
    coupon;
    userId;
    couponId;
    status;
    usedAt;
    orderId;
    createdAt;
    updatedAt;
};
exports.UserCoupon = UserCoupon;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserCoupon.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => coupon_entity_1.Coupon),
    (0, typeorm_1.JoinColumn)({ name: 'couponId' }),
    __metadata("design:type", coupon_entity_1.Coupon)
], UserCoupon.prototype, "coupon", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserCoupon.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserCoupon.prototype, "couponId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'unused' }),
    __metadata("design:type", String)
], UserCoupon.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], UserCoupon.prototype, "usedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], UserCoupon.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserCoupon.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserCoupon.prototype, "updatedAt", void 0);
exports.UserCoupon = UserCoupon = __decorate([
    (0, typeorm_1.Entity)('user_coupons')
], UserCoupon);
//# sourceMappingURL=user-coupon.entity.js.map