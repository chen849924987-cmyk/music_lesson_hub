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
exports.ReplyEvaluationDto = void 0;
const class_validator_1 = require("class-validator");
class ReplyEvaluationDto {
    replyContent;
}
exports.ReplyEvaluationDto = ReplyEvaluationDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '回复内容必须为字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: '回复内容不能为空' }),
    (0, class_validator_1.Length)(1, 2000, { message: '回复内容长度必须在 1~2000 字符之间' }),
    __metadata("design:type", String)
], ReplyEvaluationDto.prototype, "replyContent", void 0);
//# sourceMappingURL=reply-evaluation.dto.js.map