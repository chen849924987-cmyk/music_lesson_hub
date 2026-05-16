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
exports.CreateCourseDto = void 0;
const class_validator_1 = require("class-validator");
const constants_1 = require("../../../common/constants");
class CreateCourseDto {
    title;
    cover;
    description;
    categoryId;
    courseType;
    price;
    originalPrice;
    previewDuration;
    trailerVideoId;
    tags;
}
exports.CreateCourseDto = CreateCourseDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '课程标题必须是字符串' }),
    (0, class_validator_1.MaxLength)(200, { message: '课程标题不能超过200个字符' }),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '封面图URL必须是字符串' }),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "cover", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '课程简介必须是字符串' }),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: '分类ID必须是数字' }),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(constants_1.CourseType, { message: '课程类型无效' }),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "courseType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '定价必须是数字' }),
    (0, class_validator_1.Min)(0, { message: '定价不能小于0' }),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '原价必须是数字' }),
    (0, class_validator_1.Min)(0, { message: '原价不能小于0' }),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "originalPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '试看时长必须是数字' }),
    (0, class_validator_1.Min)(0, { message: '试看时长不能小于0' }),
    (0, class_validator_1.Max)(600, { message: '试看时长不能超过600秒' }),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "previewDuration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '预告视频ID必须是数字' }),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "trailerVideoId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '标签必须是字符串' }),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "tags", void 0);
//# sourceMappingURL=create-course.dto.js.map