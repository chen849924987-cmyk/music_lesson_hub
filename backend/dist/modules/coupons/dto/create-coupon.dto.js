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
exports.CreateCouponDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const constants_1 = require("../../../common/constants");
class CreateCouponDto {
    name;
    code;
    type;
    discount;
    minAmount;
    maxDiscount;
    totalCount;
    perUserLimit;
    startTime;
    endTime;
    isActive;
    description;
}
exports.CreateCouponDto = CreateCouponDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '优惠券名称不能为空' }),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '优惠券码不能为空' }),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(constants_1.CouponType, { message: '优惠券类型无效' }),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: '优惠面值必须为整数' }),
    (0, class_validator_1.Min)(1, { message: '优惠面值不能小于1' }),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: '使用门槛必须为整数' }),
    (0, class_validator_1.Min)(0, { message: '使用门槛不能为负数' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "minAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: '最大减免金额必须为整数' }),
    (0, class_validator_1.Min)(1, { message: '最大减免金额不能小于1' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "maxDiscount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: '发放数量必须为整数' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "totalCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: '每人限领数量必须为整数' }),
    (0, class_validator_1.Min)(0, { message: '每人限领数量不能为负数' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "perUserLimit", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: '开始时间格式无效' }),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: '结束时间格式无效' }),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '启用状态必须为布尔值' }),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], CreateCouponDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '描述必须为字符串' }),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "description", void 0);
//# sourceMappingURL=create-coupon.dto.js.map