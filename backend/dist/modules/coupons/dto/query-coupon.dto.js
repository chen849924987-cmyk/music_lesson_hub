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
exports.QueryCouponDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const constants_1 = require("../../../common/constants");
const constants_2 = require("../../../common/constants");
class QueryCouponDto {
    page = constants_2.PAGINATION.DEFAULT_PAGE;
    pageSize = constants_2.PAGINATION.DEFAULT_PAGE_SIZE;
    name;
    code;
    type;
    isActive;
}
exports.QueryCouponDto = QueryCouponDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: '页码必须为整数' }),
    (0, class_validator_1.Min)(1, { message: '页码最小值为1' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryCouponDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: '每页条数必须为整数' }),
    (0, class_validator_1.Min)(1, { message: '每页条数最小值为1' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryCouponDto.prototype, "pageSize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '名称必须为字符串' }),
    __metadata("design:type", String)
], QueryCouponDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '优惠券码必须为字符串' }),
    __metadata("design:type", String)
], QueryCouponDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(constants_1.CouponType, { message: '优惠券类型无效' }),
    __metadata("design:type", String)
], QueryCouponDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], QueryCouponDto.prototype, "isActive", void 0);
//# sourceMappingURL=query-coupon.dto.js.map