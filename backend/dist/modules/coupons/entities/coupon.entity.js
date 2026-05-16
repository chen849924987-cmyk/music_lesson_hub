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
exports.Coupon = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../../../common/constants");
let Coupon = class Coupon {
    id;
    name;
    code;
    type;
    discount;
    minAmount;
    maxDiscount;
    totalCount;
    perUserLimit;
    remainingCount;
    startTime;
    endTime;
    isActive;
    description;
    createdAt;
    updatedAt;
};
exports.Coupon = Coupon;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Coupon.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Coupon.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, unique: true }),
    __metadata("design:type", String)
], Coupon.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: constants_1.CouponType,
    }),
    __metadata("design:type", String)
], Coupon.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Coupon.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Coupon.prototype, "minAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Coupon.prototype, "maxDiscount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: -1 }),
    __metadata("design:type", Number)
], Coupon.prototype, "totalCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Coupon.prototype, "perUserLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: -1 }),
    __metadata("design:type", Number)
], Coupon.prototype, "remainingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Coupon.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Coupon.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Coupon.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Coupon.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Coupon.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Coupon.prototype, "updatedAt", void 0);
exports.Coupon = Coupon = __decorate([
    (0, typeorm_1.Entity)('coupons')
], Coupon);
//# sourceMappingURL=coupon.entity.js.map