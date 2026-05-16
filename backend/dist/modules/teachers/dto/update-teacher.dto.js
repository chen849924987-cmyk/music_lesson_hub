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
exports.UpdateTeacherDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateTeacherDto {
    realName;
    introduction;
    specialties;
    avatar;
    contactInfo;
    paymentAccount;
    notificationEnabled;
}
exports.UpdateTeacherDto = UpdateTeacherDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '姓名必须是字符串' }),
    (0, class_validator_1.MaxLength)(50, { message: '姓名最多50个字符' }),
    __metadata("design:type", String)
], UpdateTeacherDto.prototype, "realName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '简介必须是字符串' }),
    __metadata("design:type", String)
], UpdateTeacherDto.prototype, "introduction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '擅长领域必须是字符串' }),
    (0, class_validator_1.MaxLength)(500, { message: '擅长领域最多500个字符' }),
    __metadata("design:type", String)
], UpdateTeacherDto.prototype, "specialties", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '头像URL必须是字符串' }),
    __metadata("design:type", String)
], UpdateTeacherDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '联系方式必须是字符串' }),
    (0, class_validator_1.MaxLength)(200, { message: '联系方式最多200个字符' }),
    __metadata("design:type", String)
], UpdateTeacherDto.prototype, "contactInfo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '收款账号必须是字符串' }),
    (0, class_validator_1.MaxLength)(200, { message: '收款账号最多200个字符' }),
    __metadata("design:type", String)
], UpdateTeacherDto.prototype, "paymentAccount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '通知偏好必须是布尔值' }),
    __metadata("design:type", Boolean)
], UpdateTeacherDto.prototype, "notificationEnabled", void 0);
//# sourceMappingURL=update-teacher.dto.js.map