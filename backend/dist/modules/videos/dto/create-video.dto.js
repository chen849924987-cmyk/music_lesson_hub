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
exports.CreateVideoDto = void 0;
const class_validator_1 = require("class-validator");
class CreateVideoDto {
    originalName;
    objectName;
    fileSize;
    mimeType;
    duration;
    width;
    height;
}
exports.CreateVideoDto = CreateVideoDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '原始文件名必须为字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: '原始文件名不能为空' }),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "originalName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '对象名称必须为字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: '对象名称不能为空' }),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "objectName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '文件大小必须为数字' }),
    (0, class_validator_1.Min)(0, { message: '文件大小不能为负数' }),
    __metadata("design:type", Number)
], CreateVideoDto.prototype, "fileSize", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'MIME 类型必须为字符串' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '时长必须为数字' }),
    (0, class_validator_1.Min)(0, { message: '时长不能为负数' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVideoDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '宽度必须为数字' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVideoDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '高度必须为数字' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVideoDto.prototype, "height", void 0);
//# sourceMappingURL=create-video.dto.js.map