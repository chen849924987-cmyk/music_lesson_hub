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
exports.CreateAttachmentDto = void 0;
const class_validator_1 = require("class-validator");
const constants_1 = require("../../../common/constants");
class CreateAttachmentDto {
    courseId;
    lessonId;
    originalName;
    objectName;
    fileSize;
    mimeType;
    attachmentType;
}
exports.CreateAttachmentDto = CreateAttachmentDto;
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '课程ID必须为数字' }),
    (0, class_validator_1.IsNotEmpty)({ message: '课程ID不能为空' }),
    __metadata("design:type", Number)
], CreateAttachmentDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '课时ID必须为数字' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAttachmentDto.prototype, "lessonId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '原始文件名必须为字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: '原始文件名不能为空' }),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "originalName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '对象名称必须为字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: '对象名称不能为空' }),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "objectName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '文件大小必须为数字' }),
    (0, class_validator_1.Min)(0, { message: '文件大小不能为负数' }),
    __metadata("design:type", Number)
], CreateAttachmentDto.prototype, "fileSize", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'MIME 类型必须为字符串' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(constants_1.AttachmentType, { message: '附件类型无效' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAttachmentDto.prototype, "attachmentType", void 0);
//# sourceMappingURL=create-attachment.dto.js.map