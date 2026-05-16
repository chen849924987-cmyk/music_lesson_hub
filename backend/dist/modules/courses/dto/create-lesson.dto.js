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
exports.CreateLessonDto = void 0;
const class_validator_1 = require("class-validator");
class CreateLessonDto {
    chapterId;
    title;
    description;
    duration;
    videoId;
    isFree;
    previewDuration;
    canSinglePurchase;
    singlePrice;
    sortOrder;
}
exports.CreateLessonDto = CreateLessonDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '章节ID必须是数字' }),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "chapterId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '课时标题必须是字符串' }),
    __metadata("design:type", String)
], CreateLessonDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '课时描述必须是字符串' }),
    __metadata("design:type", String)
], CreateLessonDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '视频时长必须是数字' }),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '视频ID必须是数字' }),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "videoId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '试看标记必须是布尔值' }),
    __metadata("design:type", Boolean)
], CreateLessonDto.prototype, "isFree", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '试看时长必须是数字' }),
    (0, class_validator_1.Min)(0, { message: '试看时长不能小于0' }),
    (0, class_validator_1.Max)(600, { message: '试看时长不能超过600秒' }),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "previewDuration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '单独购买标记必须是布尔值' }),
    __metadata("design:type", Boolean)
], CreateLessonDto.prototype, "canSinglePurchase", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '单独购买价格必须是数字' }),
    (0, class_validator_1.Min)(0, { message: '单独购买价格不能小于0' }),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "singlePrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '排序权重必须是数字' }),
    __metadata("design:type", Number)
], CreateLessonDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-lesson.dto.js.map