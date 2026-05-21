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
exports.CreateEvaluationDto = void 0;
const class_validator_1 = require("class-validator");
class CreateEvaluationDto {
    rating;
    content;
}
exports.CreateEvaluationDto = CreateEvaluationDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: '评分必须为整数' }),
    (0, class_validator_1.Min)(1, { message: '评分最低为 1 星' }),
    (0, class_validator_1.Max)(5, { message: '评分最高为 5 星' }),
    __metadata("design:type", Number)
], CreateEvaluationDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '评价内容必须为字符串' }),
    (0, class_validator_1.Length)(1, 2000, { message: '评价内容长度必须在 1~2000 字符之间' }),
    __metadata("design:type", String)
], CreateEvaluationDto.prototype, "content", void 0);
//# sourceMappingURL=create-evaluation.dto.js.map