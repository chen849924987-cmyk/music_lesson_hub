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
exports.ReviewWithdrawalDto = exports.CreateWithdrawalDto = void 0;
const class_validator_1 = require("class-validator");
class CreateWithdrawalDto {
    amount;
}
exports.CreateWithdrawalDto = CreateWithdrawalDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: '提现金额必须为整数' }),
    (0, class_validator_1.Min)(1, { message: '提现金额最低为 1 元' }),
    (0, class_validator_1.Max)(100000, { message: '提现金额最高为 100,000 元' }),
    __metadata("design:type", Number)
], CreateWithdrawalDto.prototype, "amount", void 0);
class ReviewWithdrawalDto {
    action;
    remark;
}
exports.ReviewWithdrawalDto = ReviewWithdrawalDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '审核操作必须为字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: '审核操作不能为空' }),
    __metadata("design:type", String)
], ReviewWithdrawalDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '审核意见必须为字符串' }),
    (0, class_validator_1.Length)(1, 500, { message: '审核意见长度需在 1~500 字符之间' }),
    __metadata("design:type", String)
], ReviewWithdrawalDto.prototype, "remark", void 0);
//# sourceMappingURL=create-withdrawal.dto.js.map