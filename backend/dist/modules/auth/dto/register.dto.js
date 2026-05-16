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
exports.CreateAccountDto = exports.LoginDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterDto {
    username;
    password;
    nickname;
    phone;
    email;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '用户名必须是字符串' }),
    (0, class_validator_1.MinLength)(4, { message: '用户名最少4个字符' }),
    (0, class_validator_1.MaxLength)(50, { message: '用户名最多50个字符' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '密码必须是字符串' }),
    (0, class_validator_1.MinLength)(6, { message: '密码最少6个字符' }),
    (0, class_validator_1.MaxLength)(50, { message: '密码最多50个字符' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '昵称必须是字符串' }),
    (0, class_validator_1.MaxLength)(50, { message: '昵称最多50个字符' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '手机号必须是字符串' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: '邮箱格式不正确' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
class LoginDto {
    username;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '用户名必须是字符串' }),
    __metadata("design:type", String)
], LoginDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '密码必须是字符串' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class CreateAccountDto {
    username;
    password;
    nickname;
    phone;
    email;
}
exports.CreateAccountDto = CreateAccountDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '用户名必须是字符串' }),
    (0, class_validator_1.MinLength)(4, { message: '用户名最少4个字符' }),
    (0, class_validator_1.MaxLength)(50, { message: '用户名最多50个字符' }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '密码必须是字符串' }),
    (0, class_validator_1.MinLength)(6, { message: '密码最少6个字符' }),
    (0, class_validator_1.MaxLength)(50, { message: '密码最多50个字符' }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '昵称必须是字符串' }),
    (0, class_validator_1.MaxLength)(50, { message: '昵称最多50个字符' }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '手机号必须是字符串' }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: '邮箱格式不正确' }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "email", void 0);
//# sourceMappingURL=register.dto.js.map